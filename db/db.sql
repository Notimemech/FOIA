-- 1. BẢNG CẤU HÌNH CÁC MODEL AI
CREATE TABLE ai_model_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider VARCHAR(50) NOT NULL,          -- 'google', 'anthropic', 'ollama'
    model_name VARCHAR(100) NOT NULL,       -- 'gemini-3-flash-preview', 'gemini-3-pro'
    display_name VARCHAR(150) NOT NULL,
    model_type VARCHAR(20) NOT NULL,        -- 'cloud' hoặc 'local'
    endpoint_url TEXT,
    api_key_env_var VARCHAR(100),
    supports_audio BOOLEAN DEFAULT false,
    supports_caching BOOLEAN DEFAULT false,
    priority INT DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    temperature NUMERIC(2, 1) DEFAULT 0.2,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. BẢNG ĐỀ BÀI (QUESTIONS)
CREATE TABLE questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    skill VARCHAR(20) NOT NULL,             -- 'writing' hoặc 'speaking'
    part VARCHAR(20) NOT NULL,              -- 'Part 1', 'Part 2', 'Part 3', 'Task 1', 'Task 2'
    content TEXT NOT NULL,                  -- Nội dung đề bài
    image_url TEXT,                         -- URL ảnh (thường cho Writing Task 1)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. BẢNG BÀI NỘP VÀ KẾT QUẢ CHẤM ĐIỂM
CREATE TABLE assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID REFERENCES questions(id),
    skill VARCHAR(20) NOT NULL,             -- 'writing' hoặc 'speaking'
    part_type VARCHAR(50) NOT NULL,         -- 'Task 1', 'Task 2', 'Part 1', etc.
    task_prompt TEXT NOT NULL,
    image_url TEXT,
    user_input_text TEXT,
    audio_path TEXT,
    overall_band NUMERIC(2, 1),
    sub_scores JSONB,                       -- {"TR": 7.0, "CC": 6.5, "LR": 7.5, "GRA": 7.0}
    feedback JSONB,                         -- Chi tiết lỗi sai, sửa câu
    model_used VARCHAR(100),
    status VARCHAR(50) DEFAULT 'completed',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. BẢNG QUẢN LÝ BỘ NHỚ ĐỆM NGỮ CẢNH (CACHE ID CỦA GEMINI)
CREATE TABLE ai_context_caches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cache_name VARCHAR(255) NOT NULL,       -- vd: 'rubric_cambridge_cache_v1'
    provider VARCHAR(50) NOT NULL,          -- 'google'
    external_cache_id TEXT NOT NULL,        -- ID cache trả về từ API Gemini
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO ai_model_configs (provider, model_name, display_name, model_type, endpoint_url, api_key_env_var, supports_audio, supports_caching, priority, is_active)
VALUES 
-- 1. Ưu tiên hàng đầu (Chấm bài chính, tốc độ cao, giá rẻ, Native Audio)
('google', 'gemini-3-flash-preview', 'Google Gemini 3 Flash', 'cloud', NULL, 'GEMINI_API_KEY', true, true, 1, true),

-- 2. Đánh giá chuyên sâu (Deep review các bài khó hoặc bài band 8+)
('google', 'gemini-3-pro', 'Google Gemini 3 Pro', 'cloud', NULL, 'GEMINI_API_KEY', true, true, 2, true),

-- 3. Dự phòng 1 khi cần so sánh lối hành văn hoặc ngữ pháp Writing
('anthropic', 'claude-3-5-sonnet-20241022', 'Anthropic Claude 3.5 Sonnet', 'cloud', NULL, 'ANTHROPIC_API_KEY', false, true, 3, true),

-- 4. Dự phòng 2 khi hết quota model chính
('google', 'gemini-2.0-flash', 'Google Gemini 2.0 Flash (Fallback)', 'cloud', NULL, 'GEMINI_API_KEY', true, true, 4, true)