import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';

type Category = {
  id: string;
  slug: string;
  name_it: string;
  name_en: string;
  parent_id: string | null;
};

const brands = ['ASCO', 'AVENTICS', 'JOUCOMATIC', 'NUMATICS', 'EMERSON', 'SIRAI'];

const BrandsSidebar = () => {
  const { i18n } = useTranslation();
  const lang = i18n.language as 'it' | 'en';
  const { slug } = useParams();
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from('categories')
        .select('id, slug, name_it, name_en, parent_id')
        .eq('is_active', true)
        .order('sort_order');
      setCategories(data || []);
    };
    fetch();
  }, []);

  const topCategories = categories.filter(c => !c.parent_id);
  const getChildren = (parentId: string) => categories.filter(c => c.parent_id === parentId);
  const catName = (cat: Category) => lang === 'it' ? cat.name_it : cat.name_en;

  return (
    <aside className="hidden lg:block w-52 shrink-0 space-y-6">
      {/* Brands */}
      <div>
        <h3 className="text-sm font-bold uppercase tracking-wider text-primary mb-3">{lang === 'it' ? 'Marchi' : 'Brands'}</h3>
        <ul className="space-y-1">
          {brands.map(b => (
            <li key={b}>
              <Link
                to={`/brands/${b}`}
                className="text-sm text-primary hover:underline flex items-center gap-1.5"
              >
                <span className="text-primary text-xs">{'>'}</span> {b}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {/* Categories */}
      <div>
        <h3 className="text-sm font-bold uppercase tracking-wider text-primary mb-3">{lang === 'it' ? 'Categorie' : 'Categories'}</h3>
        <ul className="space-y-1">
          {topCategories.map(cat => {
            const children = getChildren(cat.id);
            const isActive = cat.slug === slug;
            return (
              <li key={cat.id}>
                <Link
                  to={`/categories/${cat.slug}`}
                  className={`text-sm font-semibold flex items-center gap-1.5 ${
                    isActive ? 'text-foreground' : 'text-primary hover:underline'
                  }`}
                >
                  <span className="text-xs">{'>'}</span> {catName(cat).toUpperCase()}
                </Link>
                {children.length > 0 && (
                  <ul className="ml-4 mt-0.5 space-y-0.5">
                    {children.map(child => {
                      const childActive = child.slug === slug;
                      return (
                        <li key={child.id}>
                          <Link
                            to={`/categories/${child.slug}`}
                            className={`text-xs ${
                              childActive ? 'text-foreground font-semibold' : 'text-primary/80 hover:text-primary hover:underline'
                            }`}
                          >
                            · {catName(child)}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </aside>
  );
};

export default BrandsSidebar;