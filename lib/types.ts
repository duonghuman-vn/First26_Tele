export type LinkItem = {
  id: string;
  url: string;
  normalized_url: string;
  title: string;
  description: string | null;
  image_url: string | null;
  domain: string;
  category: string;
  tags: string[];
  is_favorite: boolean;
  created_at: string;
};
