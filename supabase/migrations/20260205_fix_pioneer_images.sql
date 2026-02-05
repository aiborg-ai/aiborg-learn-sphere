-- Fix pioneer images with reliable placeholder URLs
-- These use ui-avatars.com which generates initials-based avatars
-- You can update these with real photos via the CMS

UPDATE knowledgebase_entries
SET thumbnail_url = CASE slug
  WHEN 'geoffrey-hinton' THEN 'https://ui-avatars.com/api/?name=Geoffrey+Hinton&size=400&background=6366f1&color=fff&bold=true'
  WHEN 'yann-lecun' THEN 'https://ui-avatars.com/api/?name=Yann+LeCun&size=400&background=8b5cf6&color=fff&bold=true'
  WHEN 'fei-fei-li' THEN 'https://ui-avatars.com/api/?name=Fei-Fei+Li&size=400&background=ec4899&color=fff&bold=true'
  WHEN 'demis-hassabis' THEN 'https://ui-avatars.com/api/?name=Demis+Hassabis&size=400&background=14b8a6&color=fff&bold=true'
  WHEN 'andrej-karpathy' THEN 'https://ui-avatars.com/api/?name=Andrej+Karpathy&size=400&background=f59e0b&color=fff&bold=true'
  WHEN 'ilya-sutskever' THEN 'https://ui-avatars.com/api/?name=Ilya+Sutskever&size=400&background=ef4444&color=fff&bold=true'
  ELSE thumbnail_url
END
WHERE topic_type = 'pioneers';
