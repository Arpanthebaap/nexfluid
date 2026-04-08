import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const EXCLUDE_PATTERNS = [
  /\/(cart|checkout|account|login|register|wishlist|compare)/i,
  /\/(privacy|terms|cookie|contact|about|faq|help|sitemap)/i,
  /\/#/,
  /\.(pdf|jpg|png|gif|svg|css|js)$/i,
  /\/cdn-cgi\//i,
  /\/index\.php/i,
];

function shouldExclude(url: string): boolean {
  return EXCLUDE_PATTERNS.some(p => p.test(url));
}

function isValvesDirectProductUrl(url: string): boolean {
  try {
    const path = new URL(url).pathname;
    if (!path.endsWith('.html')) return false;
    const segments = path.split('/').filter(Boolean);
    if (segments.length < 2) return false;
    const lastSeg = segments[segments.length - 1];
    return /^\d+[-]/.test(lastSeg);
  } catch { return false; }
}

function isValvesDirectSubcategoryUrl(url: string, baseDomain: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.hostname !== baseDomain) return false;
    if (parsed.search) return false;
    if (parsed.hash) return false;
    const path = parsed.pathname;
    if (path.endsWith('.html')) return false;
    const segments = path.split('/').filter(Boolean);
    if (segments.length === 0) return false;
    // Accept any depth of subcategory as long as first segment starts with digit-
    return /^\d+-/.test(segments[0]);
  } catch { return false; }
}

function isRsOnlineProductUrl(url: string): boolean {
  try {
    const path = new URL(url).pathname;
    return /\/web\/p\//.test(path);
  } catch { return false; }
}

function extractMaxPage(links: string[]): number {
  let maxPage = 1;
  const pagePatterns = [/[?&]page=(\d+)/, /[?&]pn=(\d+)/];
  for (const link of links) {
    for (const pattern of pagePatterns) {
      const match = link.match(pattern);
      if (match) {
        const n = parseInt(match[1], 10);
        if (!isNaN(n) && n > maxPage) maxPage = n;
      }
    }
  }
  return maxPage;
}

// Extract expected total product count from page markdown (e.g. "Showing 1-48 of 11185 products")
function extractExpectedTotal(markdown: string): number | null {
  // Patterns like "of 11185", "11185 products", "11185 risultati", "Showing 1-48 of 11,185"
  const patterns = [
    /of\s+([\d,. ]+)\s*(products?|results?|items?|prodott|risultat)/i,
    /(?:showing|mostra|affich).*?of\s+([\d,. ]+)/i,
    /([\d,. ]+)\s*(products?|results?|items?|prodott|risultat)\s*(?:found|total|trouvé|trovat)/i,
  ];
  for (const p of patterns) {
    const m = markdown.match(p);
    if (m) {
      const num = parseInt(m[1].replace(/[,.\s]/g, ''), 10);
      if (!isNaN(num) && num > 0 && num < 1000000) return num;
    }
  }
  return null;
}

async function mapUrls(url: string, firecrawlKey: string, limit = 5000): Promise<string[]> {
  try {
    console.log(`  MAP: ${url} (limit=${limit})`);
    const response = await fetch('https://api.firecrawl.dev/v1/map', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url, limit, includeSubdomains: false }),
    });

    const text = await response.text();
    let data: any;
    try { data = JSON.parse(text); } catch {
      console.error(`Map returned non-JSON: ${text.substring(0, 200)}`);
      return [];
    }

    if (!response.ok) {
      console.error(`Map API error (${response.status}):`, data);
      return [];
    }

    const links = data.links || data.data?.links || [];
    console.log(`  MAP returned ${links.length} URLs`);
    return links;
  } catch (err) {
    console.error(`Map network error for ${url}:`, err);
    return [];
  }
}

async function scrapeLinks(url: string, firecrawlKey: string): Promise<string[]> {
  try {
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        formats: ['links'],
        onlyMainContent: false,
        timeout: 45000,
      }),
    });

    const text = await response.text();
    let data: any;
    try { data = JSON.parse(text); } catch {
      console.error(`Non-JSON response for ${url}: ${text.substring(0, 200)}`);
      return [];
    }

    if (!response.ok) {
      console.error(`Scrape failed for ${url}:`, data);
      return [];
    }

    return data.data?.links || data.links || [];
  } catch (err) {
    console.error(`Network error scraping ${url}:`, err);
    return [];
  }
}

// Scrape a page and get both links and markdown (for extracting expected total)
async function scrapeWithMarkdown(url: string, firecrawlKey: string): Promise<{ links: string[]; markdown: string }> {
  try {
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        formats: ['links', 'markdown'],
        onlyMainContent: false,
        timeout: 45000,
      }),
    });

    const text = await response.text();
    let data: any;
    try { data = JSON.parse(text); } catch {
      return { links: [], markdown: '' };
    }

    if (!response.ok) return { links: [], markdown: '' };

    return {
      links: data.data?.links || data.links || [],
      markdown: data.data?.markdown || data.markdown || '',
    };
  } catch {
    return { links: [], markdown: '' };
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const SAFETY_LIMIT_MS = 110000;
  function isTimeSafe(): boolean {
    return (Date.now() - startTime) < SAFETY_LIMIT_MS;
  }

  try {
    const body = await req.json();
    const { categoryUrl, startSubcatIndex, startPage, subcategories: providedSubcats } = body;

    if (!categoryUrl) {
      return new Response(
        JSON.stringify({ success: false, error: 'categoryUrl is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!firecrawlKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'Firecrawl not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const isRsOnline = categoryUrl.includes('rs-online.com');
    const baseDomain = new URL(categoryUrl).hostname;
    const isResuming = typeof startSubcatIndex === 'number';

    console.log(`--- Discovering: ${categoryUrl} ${isResuming ? `(resuming from subcat ${startSubcatIndex}, page ${startPage || 1})` : '(fresh)'} ---`);

    const allProductUrls: string[] = [];
    let mapCalls = 0;
    let pagesScraped = 0;
    let timedOut = false;
    let resumeFrom: { subcatIndex: number; page: number } | null = null;
    let expectedTotal: number | null = null;

    const productFilter = isRsOnline ? isRsOnlineProductUrl : isValvesDirectProductUrl;
    const startIdx = startSubcatIndex || 0;
    const startPg = startPage || 1;

    // === Determine subcategories ===
    let subcatUrls: string[] = [];
    const visitedSubcats = new Set<string>();

    if (providedSubcats && Array.isArray(providedSubcats) && providedSubcats.length > 0) {
      subcatUrls = providedSubcats;
      // Mark already-processed ones as visited
      for (let i = 0; i < startIdx; i++) {
        try { visitedSubcats.add(new URL(subcatUrls[i]).pathname); } catch {}
      }
      console.log(`Using ${subcatUrls.length} provided subcategories`);
    } else {
      // Fresh call — discover subcategories via Map first, then scrape fallback
      const mapLinks = await mapUrls(categoryUrl, firecrawlKey);
      mapCalls++;

      const mapProducts = mapLinks.filter(l => productFilter(l) && !shouldExclude(l));
      allProductUrls.push(...mapProducts);

      if (!isRsOnline) {
        const rawSubcats = mapLinks.filter(l => isValvesDirectSubcategoryUrl(l, baseDomain) && !shouldExclude(l) && l !== categoryUrl);
        const seenPaths = new Set<string>();
        subcatUrls = rawSubcats.filter(u => {
          const p = new URL(u).pathname;
          if (seenPaths.has(p)) return false;
          seenPaths.add(p);
          return true;
        });
      }

      console.log(`Map: ${mapLinks.length} total, ${mapProducts.length} products, ${subcatUrls.length} subcats`);

      // If Map returned nothing useful, scrape the parent page to find subcategories
      if (mapProducts.length === 0 && subcatUrls.length === 0) {
        console.log('Map returned nothing useful, scraping parent page with markdown...');
        let parentResult = await scrapeWithMarkdown(categoryUrl, firecrawlKey);
        pagesScraped++;
        
        // Extract expected total from the parent page
        if (parentResult.markdown) {
          expectedTotal = extractExpectedTotal(parentResult.markdown);
          if (expectedTotal) console.log(`📊 Expected total from page: ${expectedTotal}`);
        }
        
        let parentLinks = parentResult.links;
        if (parentLinks.length === 0 && isTimeSafe()) {
          await new Promise(r => setTimeout(r, 2000));
          parentResult = await scrapeWithMarkdown(categoryUrl, firecrawlKey);
          pagesScraped++;
          parentLinks = parentResult.links;
          if (!expectedTotal && parentResult.markdown) {
            expectedTotal = extractExpectedTotal(parentResult.markdown);
          }
        }

        const directProducts = parentLinks.filter(l => productFilter(l) && !shouldExclude(l));
        allProductUrls.push(...directProducts);

        if (!isRsOnline) {
          subcatUrls = parentLinks.filter(l => isValvesDirectSubcategoryUrl(l, baseDomain) && !shouldExclude(l) && l !== categoryUrl);
          const seenPaths = new Set<string>();
          subcatUrls = subcatUrls.filter(u => {
            const p = new URL(u).pathname;
            if (seenPaths.has(p)) return false;
            seenPaths.add(p);
            return true;
          });
        } else {
          const rsProducts = parentLinks.filter(l => isRsOnlineProductUrl(l) && !shouldExclude(l));
          allProductUrls.push(...rsProducts);
        }

        console.log(`Scrape fallback: ${parentLinks.length} links, ${directProducts.length} products, ${subcatUrls.length} subcats`);

        // Parent-page pagination for valves-direct
        if (!isRsOnline && subcatUrls.length > 0) {
          const parentMaxPage = extractMaxPage(parentLinks);
          if (parentMaxPage > 1) {
            console.log(`valves-direct: parent page has pagination up to ${parentMaxPage}`);
            const parentPageLimit = Math.min(parentMaxPage, 500);
            let consecutiveEmpty = 0;
            for (let p = 2; p <= parentPageLimit; p++) {
              if (!isTimeSafe()) { timedOut = true; break; }
              const pageUrl = `${categoryUrl}?page=${p}`;
              const pageLinks = await scrapeLinks(pageUrl, firecrawlKey);
              pagesScraped++;
              const pageProducts = pageLinks.filter(l => productFilter(l) && !shouldExclude(l));
              if (pageProducts.length === 0) {
                consecutiveEmpty++;
                if (consecutiveEmpty >= 3) break;
                await new Promise(r => setTimeout(r, 200));
                continue;
              }
              consecutiveEmpty = 0;
              allProductUrls.push(...pageProducts);
              console.log(`  Parent page ${p}: ${pageProducts.length} products`);
              await new Promise(r => setTimeout(r, 200));
            }
          }
        }

        // rs-online parent-page pagination (resumable)
        if (isRsOnline) {
          const maxPage = Math.min(extractMaxPage(parentLinks), 200);
          console.log(`rs-online: detected maxPage=${maxPage} from parent links`);
          const rsStartPage = startPg > 1 ? startPg : 2;
          for (let p = rsStartPage; p <= maxPage; p++) {
            if (!isTimeSafe()) {
              timedOut = true;
              resumeFrom = { subcatIndex: 0, page: p };
              break;
            }
            const pageUrl = categoryUrl.includes('?') ? `${categoryUrl}&pn=${p}` : `${categoryUrl}?pn=${p}`;
            const pageLinks = await scrapeLinks(pageUrl, firecrawlKey);
            pagesScraped++;
            const pageProducts = pageLinks.filter(l => isRsOnlineProductUrl(l) && !shouldExclude(l));
            if (pageProducts.length === 0) break;
            allProductUrls.push(...pageProducts);
            console.log(`  rs-online page ${p}: ${pageProducts.length} products`);
            await new Promise(r => setTimeout(r, 200));
          }
        }
      } else if (!isRsOnline && mapProducts.length > 0) {
        // Map returned products — also try to get expected total from parent page
        const parentResult = await scrapeWithMarkdown(categoryUrl, firecrawlKey);
        pagesScraped++;
        if (parentResult.markdown) {
          expectedTotal = extractExpectedTotal(parentResult.markdown);
          if (expectedTotal) console.log(`📊 Expected total from page: ${expectedTotal}`);
        }
        // Also find subcategories from the parent page that Map may have missed
        if (parentResult.links.length > 0) {
          const extraSubcats = parentResult.links.filter(l => 
            isValvesDirectSubcategoryUrl(l, baseDomain) && !shouldExclude(l) && l !== categoryUrl
          );
          const existingPaths = new Set(subcatUrls.map(u => { try { return new URL(u).pathname; } catch { return u; } }));
          for (const s of extraSubcats) {
            try {
              const p = new URL(s).pathname;
              if (!existingPaths.has(p)) {
                existingPaths.add(p);
                subcatUrls.push(s);
              }
            } catch {}
          }
          console.log(`After parent scrape: ${subcatUrls.length} total subcats`);
        }
      }

      // rs-online: also paginate when Map DID return products
      if (isRsOnline && mapProducts.length > 0 && !resumeFrom) {
        console.log('rs-online: Map returned products, attempting pagination from parent...');
        const parentLinks = await scrapeLinks(categoryUrl, firecrawlKey);
        pagesScraped++;
        const maxPage = Math.min(extractMaxPage(parentLinks), 200);
        if (maxPage > 1) {
          console.log(`rs-online: pagination up to page ${maxPage}`);
          const rsStartPage = startPg > 1 ? startPg : 2;
          for (let p = rsStartPage; p <= maxPage; p++) {
            if (!isTimeSafe()) {
              timedOut = true;
              resumeFrom = { subcatIndex: 0, page: p };
              break;
            }
            const pageUrl = categoryUrl.includes('?') ? `${categoryUrl}&pn=${p}` : `${categoryUrl}?pn=${p}`;
            const pageLinks = await scrapeLinks(pageUrl, firecrawlKey);
            pagesScraped++;
            const pageProducts = pageLinks.filter(l => isRsOnlineProductUrl(l) && !shouldExclude(l));
            if (pageProducts.length === 0) break;
            allProductUrls.push(...pageProducts);
            console.log(`  rs-online page ${p}: ${pageProducts.length} products`);
            await new Promise(r => setTimeout(r, 200));
          }
        }
      }
    }

    // === Handle rs-online resume (pagination only, no subcats) ===
    if (isRsOnline && isResuming && !providedSubcats?.length) {
      console.log(`rs-online: resuming pagination from page ${startPg}`);
      const parentLinks = await scrapeLinks(categoryUrl, firecrawlKey);
      pagesScraped++;
      const maxPage = Math.min(extractMaxPage(parentLinks), 200);
      for (let p = startPg; p <= maxPage; p++) {
        if (!isTimeSafe()) {
          timedOut = true;
          resumeFrom = { subcatIndex: 0, page: p };
          break;
        }
        const pageUrl = categoryUrl.includes('?') ? `${categoryUrl}&pn=${p}` : `${categoryUrl}?pn=${p}`;
        const pageLinks = await scrapeLinks(pageUrl, firecrawlKey);
        pagesScraped++;
        const pageProducts = pageLinks.filter(l => isRsOnlineProductUrl(l) && !shouldExclude(l));
        if (pageProducts.length === 0) break;
        allProductUrls.push(...pageProducts);
        console.log(`  rs-online page ${p}: ${pageProducts.length} products`);
        await new Promise(r => setTimeout(r, 200));
      }
    }

    // === Scrape subcategories with pagination (resumable) + recursive child discovery ===
    for (let si = startIdx; si < subcatUrls.length; si++) {
      if (!isTimeSafe()) {
        timedOut = true;
        resumeFrom = { subcatIndex: si, page: 1 };
        console.log(`Timer expired at subcat ${si}/${subcatUrls.length}`);
        break;
      }

      const subcatUrl = subcatUrls[si];
      const subcatPath = (() => { try { return new URL(subcatUrl).pathname; } catch { return subcatUrl; } })();
      
      // Skip if already visited (dedup for recursive discovery)
      if (visitedSubcats.has(subcatPath)) {
        continue;
      }
      visitedSubcats.add(subcatPath);

      const firstPage = (si === startIdx && startPg > 1) ? startPg : 1;

      if (firstPage === 1) {
        const subcatLinks = await scrapeLinks(subcatUrl, firecrawlKey);
        pagesScraped++;
        const products = subcatLinks.filter(l => productFilter(l) && !shouldExclude(l));
        allProductUrls.push(...products);

        // === Recursive: discover child subcategories ===
        if (!isRsOnline) {
          const childSubcats = subcatLinks.filter(l => 
            isValvesDirectSubcategoryUrl(l, baseDomain) && !shouldExclude(l) && l !== subcatUrl && l !== categoryUrl
          );
          for (const childUrl of childSubcats) {
            try {
              const childPath = new URL(childUrl).pathname;
              if (!visitedSubcats.has(childPath) && !subcatUrls.includes(childUrl)) {
                // Only add if it's a deeper path than current
                const currentDepth = subcatPath.split('/').filter(Boolean).length;
                const childDepth = childPath.split('/').filter(Boolean).length;
                if (childDepth >= currentDepth) {
                  subcatUrls.push(childUrl);
                  console.log(`  📂 Found nested subcat: ${childPath} (depth ${childDepth})`);
                }
              }
            } catch {}
          }
        }

        // Check for pagination
        const maxPage = extractMaxPage(subcatLinks);
        if (maxPage > 1) {
          console.log(`  Subcat [${si}] ${subcatUrl}: pagination up to page ${maxPage}`);
          const pageLimit = Math.min(maxPage, 500);
          let consecutiveEmpty = 0;
          for (let p = 2; p <= pageLimit; p++) {
            if (!isTimeSafe()) {
              timedOut = true;
              resumeFrom = { subcatIndex: si, page: p };
              break;
            }
            const pageUrl = `${subcatUrl}?page=${p}`;
            const pageLinks = await scrapeLinks(pageUrl, firecrawlKey);
            pagesScraped++;
            const pageProducts = pageLinks.filter(l => productFilter(l) && !shouldExclude(l));
            if (pageProducts.length === 0) {
              consecutiveEmpty++;
              if (consecutiveEmpty >= 3) break;
              await new Promise(r => setTimeout(r, 200));
              continue;
            }
            consecutiveEmpty = 0;
            allProductUrls.push(...pageProducts);
            console.log(`  Page ${p}: ${pageProducts.length} products`);
            await new Promise(r => setTimeout(r, 200));
          }
          if (resumeFrom) break;
        }
      } else {
        // Resuming mid-pagination
        const subcatLinks = await scrapeLinks(subcatUrl, firecrawlKey);
        pagesScraped++;
        const maxPage = Math.min(extractMaxPage(subcatLinks), 500);
        console.log(`  Resuming subcat [${si}] from page ${firstPage}, maxPage=${maxPage}`);

        let consecutiveEmpty = 0;
        for (let p = firstPage; p <= maxPage; p++) {
          if (!isTimeSafe()) {
            timedOut = true;
            resumeFrom = { subcatIndex: si, page: p };
            break;
          }
          const pageUrl = `${subcatUrl}?page=${p}`;
          const pageLinks = await scrapeLinks(pageUrl, firecrawlKey);
          pagesScraped++;
          const pageProducts = pageLinks.filter(l => productFilter(l) && !shouldExclude(l));
          if (pageProducts.length === 0) {
            consecutiveEmpty++;
            if (consecutiveEmpty >= 3) break;
            await new Promise(r => setTimeout(r, 200));
            continue;
          }
          consecutiveEmpty = 0;
          allProductUrls.push(...pageProducts);
          console.log(`  Page ${p}: ${pageProducts.length} products`);
          await new Promise(r => setTimeout(r, 200));
        }
        if (resumeFrom) break;
      }

      await new Promise(r => setTimeout(r, 100));
    }

    // Deduplicate
    const unique = [...new Set(allProductUrls)];
    console.log(`Total unique product URLs this call: ${unique.length} (${mapCalls} map, ${pagesScraped} scrapes, timedOut=${timedOut})`);

    // Upsert into scrape_jobs with source_link tracking
    let inserted = 0;
    let requeued = 0;
    if (unique.length > 0) {
      const batchSize = 500;
      for (let i = 0; i < unique.length; i += batchSize) {
        const batch = unique.slice(i, i + batchSize).map(url => ({
          source_url: url,
          status: 'pending' as const,
          source_link: categoryUrl,
        }));
        const { data, error } = await supabase
          .from('scrape_jobs')
          .upsert(batch, { onConflict: 'source_url', ignoreDuplicates: true })
          .select('id');
        if (error) {
          console.error('Upsert error:', error);
        } else {
          inserted += (data?.length || 0);
        }
      }

      // Update source_link for existing jobs that didn't have one
      for (let i = 0; i < unique.length; i += batchSize) {
        const batch = unique.slice(i, i + batchSize);
        await supabase
          .from('scrape_jobs')
          .update({ source_link: categoryUrl })
          .in('source_url', batch)
          .is('source_link', null);
      }

      // Re-queue failed URLs (only transient failures)
      const requeueBatch = 50;
      for (let i = 0; i < unique.length; i += requeueBatch) {
        const batch = unique.slice(i, i + requeueBatch);
        const { data, error } = await supabase
          .from('scrape_jobs')
          .update({ status: 'pending', error_message: null, updated_at: new Date().toISOString() })
          .in('source_url', batch)
          .eq('status', 'failed')
          .not('error_message', 'ilike', '%brand%')
          .not('error_message', 'ilike', '%pre-filter%')
          .not('error_message', 'ilike', '%No scraped content%')
          .select('id');
        if (error) {
          console.error('Requeue error:', error);
        } else {
          requeued += (data?.length || 0);
        }
      }
    }

    // Get accurate pending count for this source
    const { count: actualPending } = await supabase
      .from('scrape_jobs')
      .select('id', { count: 'exact', head: true })
      .eq('source_link', categoryUrl)
      .eq('status', 'pending');

    // Get total discovered for this source (across all calls)
    const { count: totalDiscoveredForSource } = await supabase
      .from('scrape_jobs')
      .select('id', { count: 'exact', head: true })
      .eq('source_link', categoryUrl);

    // Determine if discovery is truly complete
    const allSubcatsExhausted = !resumeFrom;
    const discoveryComplete = allSubcatsExhausted && (
      expectedTotal === null || (totalDiscoveredForSource || 0) >= expectedTotal * 0.9
    );

    const elapsed = Math.round((Date.now() - startTime) / 1000);
    console.log(`Done in ${elapsed}s: ${unique.length} found, ${inserted} new, ${requeued} requeued, actualPending=${actualPending}, totalForSource=${totalDiscoveredForSource}, expectedTotal=${expectedTotal}, complete=${discoveryComplete}`);

    return new Response(
      JSON.stringify({
        success: true,
        categoryUrl,
        totalFound: unique.length,
        totalNew: inserted,
        totalRequeued: requeued,
        actualPending: actualPending || 0,
        totalDiscoveredForSource: totalDiscoveredForSource || 0,
        expectedTotal,
        discoveryComplete,
        mapCalls,
        pagesScraped,
        timedOut,
        elapsedSeconds: elapsed,
        totalSubcategories: subcatUrls.length,
        // Resumable fields
        resumeFrom,
        subcategories: resumeFrom ? subcatUrls : undefined,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Discovery error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
