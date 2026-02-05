-- Add thumbnail images for AI Pioneers
-- Using publicly available images from Wikimedia Commons and official sources

UPDATE knowledgebase_entries
SET thumbnail_url = CASE slug
  WHEN 'geoffrey-hinton' THEN 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Geoffrey_Hinton_at_UofT.jpg/440px-Geoffrey_Hinton_at_UofT.jpg'
  WHEN 'yann-lecun' THEN 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fe/Yann_LeCun_-_2018_%28cropped%29.jpg/440px-Yann_LeCun_-_2018_%28cropped%29.jpg'
  WHEN 'fei-fei-li' THEN 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/Fei-Fei_Li_at_AI_for_Good_2017.jpg/440px-Fei-Fei_Li_at_AI_for_Good_2017.jpg'
  WHEN 'demis-hassabis' THEN 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ef/Demis_Hassabis_Royal_Society.jpg/440px-Demis_Hassabis_Royal_Society.jpg'
  WHEN 'andrej-karpathy' THEN 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/18/Andrej_Karpathy_World_Economic_Forum_2025.jpg/440px-Andrej_Karpathy_World_Economic_Forum_2025.jpg'
  WHEN 'ilya-sutskever' THEN 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d5/Ilya_Sutskever_in_2018.jpg/440px-Ilya_Sutskever_in_2018.jpg'
  ELSE thumbnail_url
END
WHERE topic_type = 'pioneers' AND slug IN (
  'geoffrey-hinton', 'yann-lecun', 'fei-fei-li',
  'demis-hassabis', 'andrej-karpathy', 'ilya-sutskever'
);
