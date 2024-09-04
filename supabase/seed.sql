INSERT INTO categories (name) VALUES ('プログラミング'), ('デザイン'), ('ビジネス');

INSERT INTO gpts (name, description, url, category_id)
VALUES 
('コードヘルパー', 'プログラミングの質問に答えるGPT', 'https://chat.openai.com/g/...', 1),
('デザインアシスタント', 'UIデザインのアイデアを提供するGPT', 'https://chat.openai.com/g/...', 2);