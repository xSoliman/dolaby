-- Add underwear to existing Dolaby databases.
alter type public.item_category add value if not exists 'underwear' after 'bottom';
