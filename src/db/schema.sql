-- StudyPlan Table
CREATE TABLE IF NOT EXISTS study_plans (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL CHECK (type IN ('cycle', 'schedule')),
    exam_date TEXT,
    days_until_exam INTEGER,
    total_hours REAL NOT NULL DEFAULT 0,
    focus_areas TEXT, -- JSON array
    intensity TEXT CHECK (intensity IN ('low', 'medium', 'high')),
    methodology TEXT CHECK (methodology IN ('pomodoro', 'timeboxing', 'custom')),
    weekly_hour_limit REAL,
    data TEXT, -- JSON data
    cycle_data TEXT, -- JSON array
    weekly_data TEXT, -- JSON array
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- StudySubject Table
CREATE TABLE IF NOT EXISTS study_subjects (
    id TEXT PRIMARY KEY,
    plan_id TEXT NOT NULL,
    name TEXT NOT NULL,
    weight REAL DEFAULT 1.0,
    level TEXT CHECK (level IN ('beginner', 'intermediate', 'advanced')),
    color TEXT,
    priority INTEGER DEFAULT 0,
    last_studied TEXT,
    total_time REAL DEFAULT 0,
    custom_subject BOOLEAN DEFAULT FALSE,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (plan_id) REFERENCES study_plans(id) ON DELETE CASCADE
);

-- StudyTopic Table
CREATE TABLE IF NOT EXISTS study_topics (
    id TEXT PRIMARY KEY,
    subject_id TEXT NOT NULL,
    name TEXT NOT NULL,
    weight REAL DEFAULT 1.0,
    completed BOOLEAN DEFAULT FALSE,
    last_studied TEXT,
    total_time REAL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (subject_id) REFERENCES study_subjects(id) ON DELETE CASCADE
);

-- StudySubtopic Table
CREATE TABLE IF NOT EXISTS study_subtopics (
    id TEXT PRIMARY KEY,
    topic_id TEXT NOT NULL,
    name TEXT NOT NULL,
    weight REAL DEFAULT 1.0,
    completed BOOLEAN DEFAULT FALSE,
    last_studied TEXT,
    total_time REAL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (topic_id) REFERENCES study_topics(id) ON DELETE CASCADE
);

-- StudySession Table
CREATE TABLE IF NOT EXISTS study_sessions (
    id TEXT PRIMARY KEY,
    subject TEXT NOT NULL,
    topic TEXT,
    subtopic TEXT,
    start_time TEXT NOT NULL,
    end_time TEXT,
    duration INTEGER NOT NULL DEFAULT 0,
    completed BOOLEAN DEFAULT FALSE,
    notes TEXT,
    performance TEXT CHECK (performance IN ('low', 'medium', 'high')),
    task_id TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- SavedPlan Table (for multiple plans management)
CREATE TABLE IF NOT EXISTS saved_plans (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    plan_id TEXT NOT NULL,
    is_active BOOLEAN DEFAULT FALSE,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (plan_id) REFERENCES study_plans(id) ON DELETE CASCADE
);

-- DailyLog Table
CREATE TABLE IF NOT EXISTS daily_logs (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL,
    data TEXT NOT NULL, -- JSON data
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_study_subjects_plan_id ON study_subjects(plan_id);
CREATE INDEX IF NOT EXISTS idx_study_topics_subject_id ON study_topics(subject_id);
CREATE INDEX IF NOT EXISTS idx_study_subtopics_topic_id ON study_subtopics(topic_id);
CREATE INDEX IF NOT EXISTS idx_study_sessions_subject ON study_sessions(subject);
CREATE INDEX IF NOT EXISTS idx_study_sessions_start_time ON study_sessions(start_time);
CREATE INDEX IF NOT EXISTS idx_saved_plans_is_active ON saved_plans(is_active);
CREATE INDEX IF NOT EXISTS idx_daily_logs_date ON daily_logs(date);

-- Triggers for updated_at
CREATE TRIGGER IF NOT EXISTS update_study_plans_updated_at 
    AFTER UPDATE ON study_plans
BEGIN
    UPDATE study_plans SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_study_subjects_updated_at 
    AFTER UPDATE ON study_subjects
BEGIN
    UPDATE study_subjects SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_study_topics_updated_at 
    AFTER UPDATE ON study_topics
BEGIN
    UPDATE study_topics SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_study_subtopics_updated_at 
    AFTER UPDATE ON study_subtopics
BEGIN
    UPDATE study_subtopics SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_study_sessions_updated_at 
    AFTER UPDATE ON study_sessions
BEGIN
    UPDATE study_sessions SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_saved_plans_updated_at 
    AFTER UPDATE ON saved_plans
BEGIN
    UPDATE saved_plans SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_daily_logs_updated_at 
    AFTER UPDATE ON daily_logs
BEGIN
    UPDATE daily_logs SET updated_at = datetime('now') WHERE id = NEW.id;
END;

-- App Settings Table (Pomodoro, theme, notifications)
CREATE TABLE IF NOT EXISTS app_settings (
    id TEXT PRIMARY KEY,
    setting_key TEXT NOT NULL UNIQUE,
    setting_value TEXT NOT NULL,
    setting_type TEXT CHECK (setting_type IN ('string', 'number', 'boolean', 'json')),
    category TEXT CHECK (category IN ('pomodoro', 'theme', 'notifications', 'general')),
    description TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Study Goals Table (study goals with deadlines)
CREATE TABLE IF NOT EXISTS study_goals (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    target_type TEXT CHECK (target_type IN ('hours', 'sessions', 'topics', 'subjects')),
    target_value REAL NOT NULL,
    current_value REAL DEFAULT 0,
    deadline TEXT, -- ISO datetime
    priority INTEGER DEFAULT 0,
    status TEXT CHECK (status IN ('active', 'completed', 'paused', 'cancelled')) DEFAULT 'active',
    category TEXT,
    subject_id TEXT, -- optional FK to study_subjects
    topic_id TEXT, -- optional FK to study_topics
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (subject_id) REFERENCES study_subjects(id) ON DELETE SET NULL,
    FOREIGN KEY (topic_id) REFERENCES study_topics(id) ON DELETE SET NULL
);

-- Performance Metrics Table (aggregated statistics)
CREATE TABLE IF NOT EXISTS performance_metrics (
    id TEXT PRIMARY KEY,
    metric_type TEXT NOT NULL CHECK (metric_type IN ('daily', 'weekly', 'monthly', 'session')),
    metric_date TEXT NOT NULL, -- ISO date (YYYY-MM-DD for daily/weekly/monthly, datetime for session)
    study_time REAL DEFAULT 0, -- in minutes
    sessions_count INTEGER DEFAULT 0,
    subjects_studied INTEGER DEFAULT 0,
    topics_completed INTEGER DEFAULT 0,
    pomodoros_completed INTEGER DEFAULT 0,
    average_session_duration REAL DEFAULT 0,
    focus_score REAL DEFAULT 0, -- 0-100 scale
    productivity_score REAL DEFAULT 0, -- 0-100 scale
    streak_days INTEGER DEFAULT 0,
    subject_breakdown TEXT, -- JSON object with subject_name: time_spent
    performance_data TEXT, -- JSON object for additional metrics
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Review Schedules Table (Spaced Repetition System)
CREATE TABLE IF NOT EXISTS review_schedules (
    id TEXT PRIMARY KEY,
    item_type TEXT CHECK (item_type IN ('question', 'topic')) DEFAULT 'question',
    item_id TEXT NOT NULL, -- question_id or topic_id
    topic_id TEXT, -- for aggregation and filtering
    subject_id TEXT, -- for aggregation and filtering
    repetitions INTEGER DEFAULT 0,
    interval_days REAL DEFAULT 1,
    ease_factor REAL DEFAULT 2.5,
    correct_streak INTEGER DEFAULT 0,
    last_review TEXT, -- ISO datetime
    next_review_at TEXT NOT NULL, -- ISO datetime
    last_result INTEGER, -- Quality 1-5 from SM-2
    last_confidence TEXT CHECK (last_confidence IN ('certeza', 'duvida', 'chute')),
    last_room TEXT CHECK (last_room IN ('triagem', 'vermelha', 'amarela', 'verde')),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (topic_id) REFERENCES study_topics(id) ON DELETE SET NULL,
    FOREIGN KEY (subject_id) REFERENCES study_subjects(id) ON DELETE SET NULL
);

-- Additional Indexes for new tables
CREATE INDEX IF NOT EXISTS idx_app_settings_key ON app_settings(setting_key);
CREATE INDEX IF NOT EXISTS idx_app_settings_category ON app_settings(category);
CREATE INDEX IF NOT EXISTS idx_study_goals_status ON study_goals(status);
CREATE INDEX IF NOT EXISTS idx_study_goals_deadline ON study_goals(deadline);
CREATE INDEX IF NOT EXISTS idx_study_goals_subject_id ON study_goals(subject_id);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_type_date ON performance_metrics(metric_type, metric_date);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_date ON performance_metrics(metric_date);
CREATE INDEX IF NOT EXISTS idx_review_schedules_next_review ON review_schedules(next_review_at);
CREATE INDEX IF NOT EXISTS idx_review_schedules_item ON review_schedules(item_type, item_id);
CREATE INDEX IF NOT EXISTS idx_review_schedules_topic_id ON review_schedules(topic_id);
CREATE INDEX IF NOT EXISTS idx_review_schedules_subject_id ON review_schedules(subject_id);

-- Triggers for updated_at on new tables
CREATE TRIGGER IF NOT EXISTS update_app_settings_updated_at 
    AFTER UPDATE ON app_settings
BEGIN
    UPDATE app_settings SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_study_goals_updated_at 
    AFTER UPDATE ON study_goals
BEGIN
    UPDATE study_goals SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_performance_metrics_updated_at 
    AFTER UPDATE ON performance_metrics
BEGIN
    UPDATE performance_metrics SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_review_schedules_updated_at 
    AFTER UPDATE ON review_schedules
BEGIN
    UPDATE review_schedules SET updated_at = datetime('now') WHERE id = NEW.id;
END;

-- Questions Table
CREATE TABLE IF NOT EXISTS questions (
    id TEXT PRIMARY KEY,
    topic_id TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    options TEXT, -- JSON array of options
    correct_answer TEXT NOT NULL,
    explanation TEXT,
    difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')) DEFAULT 'medium',
    tags TEXT, -- JSON array
    images TEXT, -- JSON array of base64 image data
    examining_board TEXT, -- Banca examinadora
    position TEXT, -- Cargo
    exam_year TEXT, -- Ano da prova
    institution TEXT, -- Instituição/Órgão
    times_answered INTEGER DEFAULT 0,
    times_correct INTEGER DEFAULT 0,
    accuracy_rate REAL DEFAULT 0, -- calculated field (times_correct / times_answered)
    room TEXT CHECK (room IN ('triagem', 'vermelha', 'amarela', 'verde')) DEFAULT 'triagem',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (topic_id) REFERENCES study_topics(id) ON DELETE CASCADE
);

-- Question Attempts Table
CREATE TABLE IF NOT EXISTS question_attempts (
    id TEXT PRIMARY KEY,
    question_id TEXT NOT NULL,
    battle_session_id TEXT,
    answer TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL,
    confidence_level TEXT CHECK (confidence_level IN ('certeza', 'duvida', 'chute')) DEFAULT 'certeza',
    time_taken INTEGER, -- seconds
    xp_earned INTEGER DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
    FOREIGN KEY (battle_session_id) REFERENCES battle_sessions(id) ON DELETE SET NULL
);

-- Battle Sessions Table
CREATE TABLE IF NOT EXISTS battle_sessions (
    id TEXT PRIMARY KEY,
    room TEXT CHECK (room IN ('triagem', 'vermelha', 'amarela', 'verde')) NOT NULL,
    total_questions INTEGER NOT NULL,
    correct_answers INTEGER DEFAULT 0,
    total_xp REAL DEFAULT 0,
    accuracy_rate REAL DEFAULT 0,
    start_time TEXT NOT NULL,
    end_time TEXT,
    duration INTEGER, -- seconds
    completed BOOLEAN DEFAULT FALSE,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- User Progress Table (XP and leveling system)
CREATE TABLE IF NOT EXISTS user_progress (
    id TEXT PRIMARY KEY DEFAULT 'user_progress',
    total_xp REAL DEFAULT 0,
    current_level INTEGER DEFAULT 1,
    xp_for_next_level REAL DEFAULT 100,
    battles_won INTEGER DEFAULT 0,
    questions_answered INTEGER DEFAULT 0,
    questions_correct INTEGER DEFAULT 0,
    streak_days INTEGER DEFAULT 0,
    last_battle_date TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Indexes for new tables
CREATE INDEX IF NOT EXISTS idx_questions_topic_id ON questions(topic_id);
CREATE INDEX IF NOT EXISTS idx_questions_room ON questions(room);
CREATE INDEX IF NOT EXISTS idx_questions_accuracy_rate ON questions(accuracy_rate);
CREATE INDEX IF NOT EXISTS idx_question_attempts_question_id ON question_attempts(question_id);
CREATE INDEX IF NOT EXISTS idx_question_attempts_battle_session_id ON question_attempts(battle_session_id);
CREATE INDEX IF NOT EXISTS idx_battle_sessions_room ON battle_sessions(room);
CREATE INDEX IF NOT EXISTS idx_battle_sessions_start_time ON battle_sessions(start_time);

-- Triggers for updated_at on new tables
CREATE TRIGGER IF NOT EXISTS update_questions_updated_at 
    AFTER UPDATE ON questions
BEGIN
    UPDATE questions SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_battle_sessions_updated_at 
    AFTER UPDATE ON battle_sessions
BEGIN
    UPDATE battle_sessions SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_user_progress_updated_at 
    AFTER UPDATE ON user_progress
BEGIN
    UPDATE user_progress SET updated_at = datetime('now') WHERE id = NEW.id;
END;

-- Trigger to update question accuracy when new attempt is added
CREATE TRIGGER IF NOT EXISTS update_question_accuracy_after_attempt
    AFTER INSERT ON question_attempts
BEGIN
    UPDATE questions 
    SET 
        times_answered = times_answered + 1,
        times_correct = times_correct + CASE WHEN NEW.is_correct THEN 1 ELSE 0 END,
        accuracy_rate = CASE 
            WHEN times_answered + 1 > 0 
            THEN (times_correct + CASE WHEN NEW.is_correct THEN 1 ELSE 0 END) * 100.0 / (times_answered + 1)
            ELSE 0 
        END,
        room = CASE 
            WHEN (times_correct + CASE WHEN NEW.is_correct THEN 1 ELSE 0 END) * 100.0 / (times_answered + 1) < 70 THEN 'vermelha'
            WHEN (times_correct + CASE WHEN NEW.is_correct THEN 1 ELSE 0 END) * 100.0 / (times_answered + 1) <= 85 THEN 'amarela'
            WHEN (times_correct + CASE WHEN NEW.is_correct THEN 1 ELSE 0 END) * 100.0 / (times_answered + 1) > 85 THEN 'verde'
            ELSE room
        END
    WHERE id = NEW.question_id;
END;