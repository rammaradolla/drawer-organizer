import { supabase } from './supabaseClient';

export async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const res = await fetch(dataUrl);
  return await res.blob();
}

export async function uploadPreviewImage(userId: string, file: Blob): Promise<string | null> {
  const filePath = `${userId}/${Date.now()}.png`;
  const { error } = await supabase.storage.from('exports').upload(filePath, file, { upsert: true });
  if (error) throw error;
  const { data } = supabase.storage.from('exports').getPublicUrl(filePath);
  return data?.publicUrl || null;
}

export async function insertDesign({
  userId, jsonLayout, woodType, dimensions, previewUrl
}: {
  userId: string,
  jsonLayout: any,
  woodType: string,
  dimensions: string,
  previewUrl: string
}): Promise<string> {
  const { data, error } = await supabase
    .from('designs')
    .insert([{
      user_id: userId,
      json_layout: jsonLayout,
      wood_type: woodType,
      dimensions,
      preview_url: previewUrl,
    }])
    .select('id')
    .single();
  if (error) throw error;
  return data.id;
}

export async function checkDesignInCart(userId: string, jsonLayout: any): Promise<string | null> {
  // Find if a design with the same layout exists for this user
  const { data: designs } = await supabase
    .from('designs')
    .select('id')
    .eq('user_id', userId)
    .eq('json_layout', jsonLayout);
  if (designs && designs.length > 0) {
    // Check if in cart
    const designId = designs[0].id;
    const { data: cart } = await supabase
      .from('cart_items')
      .select('id')
      .eq('user_id', userId)
      .eq('design_id', designId);
    if (cart && cart.length > 0) return designId;
    return null;
  }
  return null;
}

export async function addToCart(userId: string, designId: string) {
  console.log("Adding to cart with:", {
    userId,
    designId,
  });
  const { data: existing } = await supabase
    .from('cart_items')
    .select('id')
    .eq('user_id', userId)
    .eq('design_id', designId)
    .maybeSingle();
  if (existing) return;
  const { error } = await supabase
    .from('cart_items')
    .insert([{ user_id: userId, design_id: designId, quantity: 1 }]);
  if (error) throw error;
}

export async function fetchCartItems(userId: string) {
  // Fetch cart items joined with design details
  const { data, error } = await supabase
    .from('cart_items')
    .select(`id, quantity, design_id, designs:design_id (id, json_layout, wood_type, dimensions, preview_url, created_at)`)
    .eq('user_id', userId);
  if (error) throw error;
  return data;
} 