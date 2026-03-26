import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const ALLOWED_BRANDS = ['PARKER', 'ASCO', 'AVENTICS', 'JOUCOMATIC', 'NUMATICS', 'EMERSON', 'SIRAI'];
const BRAND_NORMALIZATION: Record<string, string> = {
  'EMERSON AVENTICS': 'AVENTICS',
  'EMERSON ASCO': 'ASCO',
  'AVENTICS': 'AVENTICS',
  'PARKER': 'PARKER',
  'PARKER HANNIFIN': 'PARKER',
  'ASCO NUMATICS': 'NUMATICS',
};

// Known non-whitelisted brands to reject early (saves AI credits)
// IMPORTANT: Only brands that are unambiguous full words — no short tokens
const REJECTED_BRANDS = [
  'BURKERT', 'BÜRKERT', 'PNEUMAX', 'CAMOZZI', 'MINDMAN', 'DELTROL',
  'FESTO', 'SMC', 'NORGREN', 'BOSCH REXROTH', 'REXROTH', 'HAFNER', 'AIRTAC',
  'METALWORK', 'METAL WORK', 'HUMPHREY', 'CLIPPARD', 'BIMBA',
  'CKD', 'KOGANEI', 'PISCO', 'JANATICS', 'AIRTEC', 'VERSA',
  'MEAD', 'SCHRADER', 'ROTORK', 'BIFFI', 'KEYSTONE',
];

// These short/ambiguous tokens need word-boundary matching to avoid false positives
const AMBIGUOUS_REJECTED_BRANDS = ['UNIVER', 'ROSS', 'MAC', 'BOSCH'];

function normalizeBrand(brand: string): string | null {
  if (!brand) return null;
  const upper = brand.trim().toUpperCase();
  if (BRAND_NORMALIZATION[upper]) return BRAND_NORMALIZATION[upper];
  const match = ALLOWED_BRANDS.find(b => upper === b || upper.startsWith(b + ' ') || upper.endsWith(' ' + b));
  if (match) return match;
  if (upper.startsWith('EMERSON ')) {
    const rest = upper.replace('EMERSON ', '');
    if (ALLOWED_BRANDS.includes(rest)) return rest;
  }
  return null;
}

// Word-boundary brand check: ensures "MAC" doesn't match "MACHINE" or "MACRO"
function matchesWordBoundary(text: string, brand: string): boolean {
  const regex = new RegExp(`(?:^|[\\s,;:()\\[\\]/"'])${brand}(?:[\\s,;:()\\[\\]/"']|$)`, 'i');
  return regex.test(text);
}

// Detect brand from content with strict matching
function detectBrandFromContent(markdown: string, metadata: any, sourceUrl: string): { brand: string | null; isRejected: boolean } {
  const text = `${markdown} ${metadata?.title || ''} ${metadata?.description || ''} ${sourceUrl}`.toUpperCase();
  
  // Check allowed brands first (priority over rejected)
  for (const ab of ALLOWED_BRANDS) {
    if (text.includes(ab)) {
      return { brand: ab, isRejected: false };
    }
  }
  for (const [key, val] of Object.entries(BRAND_NORMALIZATION)) {
    if (text.includes(key)) {
      return { brand: val, isRejected: false };
    }
  }
  
  // Check unambiguous rejected brands (simple includes is safe for long names)
  for (const rb of REJECTED_BRANDS) {
    if (text.includes(rb)) {
      return { brand: rb, isRejected: true };
    }
  }
  
  // Check ambiguous rejected brands with word-boundary matching
  // Only check title + URL (more reliable signal) — not full markdown body
  const titleUrlText = `${metadata?.title || ''} ${sourceUrl}`.toUpperCase();
  for (const rb of AMBIGUOUS_REJECTED_BRANDS) {
    if (matchesWordBoundary(titleUrlText, rb)) {
      return { brand: rb, isRejected: true };
    }
  }
  
  return { brand: null, isRejected: false };
}

function extractFromMarkdown(markdown: string, metadata: any): { productName: string; brand: string; description: string; specs: any[] } {
  const title = metadata?.title || '';
  const metaDesc = metadata?.description || '';
  
  let productName = title;
  if (!productName) {
    const headingMatch = markdown.match(/^#\s+(.+)$/m);
    if (headingMatch) productName = headingMatch[1].trim();
  }
  if (!productName) productName = 'Unknown Product';
  
  const textUpper = `${markdown} ${title}`.toUpperCase();
  let brand = '';
  for (const ab of ALLOWED_BRANDS) {
    if (textUpper.includes(ab)) {
      brand = ab;
      break;
    }
  }
  for (const [key, val] of Object.entries(BRAND_NORMALIZATION)) {
    if (textUpper.includes(key)) {
      brand = val;
      break;
    }
  }
  
  const description = metaDesc || markdown.slice(0, 2000);
  return { productName, brand, description, specs: [] };
}

function extractCategorySlug(sourceUrl: string): string | null {
  try {
    const path = new URL(sourceUrl).pathname;
    const segments = path.split('/').filter(Boolean);
    if (segments.length >= 2) {
      return segments[segments.length - 2];
    }
  } catch {}
  return null;
}

function buildCategoryTree(categories: any[]): string {
  const byParent = new Map<string | null, any[]>();
  for (const c of categories) {
    const pid = c.parent_id || null;
    if (!byParent.has(pid)) byParent.set(pid, []);
    byParent.get(pid)!.push(c);
  }
  function render(parentId: string | null, depth: number): string {
    const children = byParent.get(parentId) || [];
    return children.map(c => {
      const indent = '  '.repeat(depth);
      const line = `${indent}- ${c.name_en} (slug:${c.slug}, id:${c.id})`;
      const sub = render(c.id, depth + 1);
      return sub ? `${line}\n${sub}` : line;
    }).join('\n');
  }
  return render(null, 0);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { batchSize = 2 } = await req.json();
    const SAFETY_MS = 90_000;
    const fnStart = Date.now();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    if (!lovableApiKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'LOVABLE_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: jobs, error: fetchError } = await supabase
      .from('scrape_jobs')
      .select('*')
      .eq('status', 'scraped')
      .limit(batchSize);

    if (fetchError) {
      return new Response(
        JSON.stringify({ success: false, error: fetchError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!jobs?.length) {
      return new Response(
        JSON.stringify({ success: true, processed: 0, message: 'No scraped jobs to process' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: categories } = await supabase
      .from('categories')
      .select('id, name_en, name_it, slug, parent_id')
      .eq('is_active', true);

    const allCategories = categories || [];
    const slugToCategory = new Map<string, { id: string; name_en: string }>();
    for (const c of allCategories) {
      slugToCategory.set(c.slug, { id: c.id, name_en: c.name_en });
    }
    const categoryTree = buildCategoryTree(allCategories);

    let processed = 0;
    let failed = 0;
    let skippedBrand = 0;

    for (const job of jobs) {
      try {
        const rawMarkdown = job.raw_data?.markdown || '';
        const rawMetadata = job.raw_data?.metadata || {};

        // STEP 1: Early brand detection with strict matching
        const brandCheck = detectBrandFromContent(rawMarkdown, rawMetadata, job.source_url);
        if (brandCheck.isRejected) {
          console.log(`Pre-filter rejected job ${job.id}: non-whitelisted brand "${brandCheck.brand}" from ${job.source_url}`);
          await supabase.from('scrape_jobs').update({
            status: 'failed',
            error_message: `Pre-filter: non-whitelisted brand "${brandCheck.brand}"`,
            updated_at: new Date().toISOString(),
          }).eq('id', job.id);
          skippedBrand++;
          failed++;
          continue;
        }

        const extracted = extractFromMarkdown(rawMarkdown, rawMetadata);
        const productName = extracted.productName;
        const brand = extracted.brand || brandCheck.brand || '';
        const originalDesc = extracted.description;

        const hasContent = (rawMarkdown && rawMarkdown.trim().length > 50) || 
                           (productName && productName !== 'Unknown Product');
        if (!hasContent) {
          console.log(`Skipping job ${job.id}: no meaningful scraped content`);
          await supabase.from('scrape_jobs').update({
            status: 'failed',
            error_message: 'No scraped content available — skipped to prevent hallucination',
            updated_at: new Date().toISOString(),
          }).eq('id', job.id);
          failed++;
          continue;
        }

        let matchedCategoryId: string | null = null;
        let matchedCategoryName = '';
        const slug = extractCategorySlug(job.source_url);
        if (slug) {
          const match = slugToCategory.get(slug);
          if (match) {
            matchedCategoryId = match.id;
            matchedCategoryName = match.name_en;
          }
        }

        const categoryInstruction = matchedCategoryId
          ? `Category has been determined from URL: "${matchedCategoryName}" (id: ${matchedCategoryId}). Use this category_id.`
          : `Match this product to the BEST DEEPEST (leaf) category from the tree below. Always prefer the most specific subcategory, NEVER a parent when children exist.\n\nCATEGORY TREE:\n${categoryTree}`;

        const prompt = `You are a product content specialist for an industrial equipment catalog. Process the following product data and return structured output.

PRODUCT DATA:
- Name: ${productName}
- Brand: ${brand}
- Source URL: ${job.source_url}
- Page title: ${rawMetadata.title || 'N/A'}
- Original description: ${originalDesc.slice(0, 1500)}
- Markdown content (first 2000 chars): ${rawMarkdown.slice(0, 2000)}

TASKS:
1. Rewrite the product description in English — must be 100% original, professional, SEO-friendly. Do NOT copy any text from the original.
2. Translate the rewritten description to Italian.
3. Generate an SEO meta title (max 60 chars) in both English and Italian. Include the product code if available.
4. Generate an SEO meta description (max 160 chars) in both English and Italian.
5. ${categoryInstruction}
6. Generate a clean product code/SKU if not available.
7. Extract ALL technical specifications as an array of {name, value, unit} objects. Parse them from the markdown text.`;

        const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${lovableApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash-lite',
            messages: [
              { role: 'system', content: 'You are a product content specialist. Return structured data via the provided tool.' },
              { role: 'user', content: prompt }
            ],
            tools: [{
              type: 'function',
              function: {
                name: 'save_product',
                description: 'Save processed product data',
                parameters: {
                  type: 'object',
                  properties: {
                    name_en: { type: 'string', description: 'Product name in English' },
                    name_it: { type: 'string', description: 'Product name in Italian' },
                    description_en: { type: 'string', description: 'Rewritten description in English' },
                    description_it: { type: 'string', description: 'Translated description in Italian' },
                    meta_title_en: { type: 'string', description: 'SEO title English (max 60 chars)' },
                    meta_title_it: { type: 'string', description: 'SEO title Italian (max 60 chars)' },
                    meta_description_en: { type: 'string', description: 'SEO meta desc English (max 160 chars)' },
                    meta_description_it: { type: 'string', description: 'SEO meta desc Italian (max 160 chars)' },
                    category_id: { type: 'string', description: 'Best matching category UUID' },
                    product_code: { type: 'string', description: 'Product code/SKU' },
                    brand: { type: 'string', description: 'Brand name' },
                    specifications: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, value: { type: 'string' }, unit: { type: 'string' } }, required: ['name', 'value'] }, description: 'Technical specifications' },
                  },
                  required: ['name_en', 'name_it', 'description_en', 'description_it', 'meta_title_en', 'meta_title_it', 'meta_description_en', 'meta_description_it', 'specifications'],
                  additionalProperties: false
                }
              }
            }],
            tool_choice: { type: 'function', function: { name: 'save_product' } }
          }),
        });

        if (!response.ok) {
          const errText = await response.text();
          console.error(`AI error for job ${job.id}:`, response.status, errText);
          if (response.status === 429) {
            return new Response(
              JSON.stringify({ success: true, processed, failed, skippedBrand, rateLimited: true, message: 'Rate limited — retry in a moment' }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
          if (response.status === 402) {
            return new Response(
              JSON.stringify({ success: false, error: 'AI credits exhausted. Add funds at Settings > Workspace > Usage.' }),
              { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
          await supabase.from('scrape_jobs').update({
            status: 'failed',
            error_message: `AI error: ${response.status}`,
            updated_at: new Date().toISOString(),
          }).eq('id', job.id);
          failed++;
          continue;
        }

        const aiData = await response.json();
        const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];

        if (!toolCall) {
          await supabase.from('scrape_jobs').update({
            status: 'failed',
            error_message: 'AI did not return structured data',
            updated_at: new Date().toISOString(),
          }).eq('id', job.id);
          failed++;
          continue;
        }

        const processedData = JSON.parse(toolCall.function.arguments);

        if (matchedCategoryId) {
          processedData.category_id = matchedCategoryId;
        }

        const imageUrls: string[] = [];
        const imgRegex = /!\[.*?\]\((https?:\/\/[^\s)]+)\)/g;
        let imgMatch;
        while ((imgMatch = imgRegex.exec(rawMarkdown)) !== null) {
          imageUrls.push(imgMatch[1]);
        }
        if (rawMetadata.ogImage) imageUrls.push(rawMetadata.ogImage);
        processedData.images = imageUrls;
        
        processedData.specifications = processedData.specifications?.length ? processedData.specifications : [];
        processedData.source_url = job.source_url;
        processedData.description_original = originalDesc;

        const rawBrand = processedData.brand || brand || '';
        const normalizedBrand = normalizeBrand(rawBrand);
        if (!normalizedBrand) {
          console.log(`Rejected job ${job.id}: invalid brand "${rawBrand}"`);
          await supabase.from('scrape_jobs').update({
            status: 'failed',
            error_message: `Invalid brand "${rawBrand}" — not in allowed list`,
            updated_at: new Date().toISOString(),
          }).eq('id', job.id);
          failed++;
          continue;
        }
        processedData.brand = normalizedBrand;
        if (!processedData.product_code) processedData.product_code = '';

        await supabase.from('scrape_jobs').update({
          status: 'processed',
          processed_data: processedData,
          category_id: processedData.category_id || null,
          updated_at: new Date().toISOString(),
        }).eq('id', job.id);

        processed++;
        await new Promise(r => setTimeout(r, 1000));
      } catch (err) {
        console.error(`Error processing job ${job.id}:`, err);
        await supabase.from('scrape_jobs').update({
          status: 'failed',
          error_message: err instanceof Error ? err.message : 'Unknown error',
          updated_at: new Date().toISOString(),
        }).eq('id', job.id);
        failed++;
      }
    }

    return new Response(
      JSON.stringify({ success: true, processed, failed, skippedBrand, total: jobs.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('AI process error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
