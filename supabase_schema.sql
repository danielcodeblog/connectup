-- Storage Buckets Setup
-- Run these in the Supabase SQL Editor

-- Create buckets if they don't exist
-- Note: insert into storage.buckets only works if you have permissions
-- Usually done via the UI, but here is the SQL for reference

INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('images', 'images', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('videos', 'videos', true)
ON CONFLICT (id) DO NOTHING;

-- RLS Policies for Storage

-- Avatars bucket policies
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Authenticated Upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');
CREATE POLICY "Owner Update" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid() = (storage.foldername(name))[1]::uuid);
CREATE POLICY "Owner Delete" ON storage.objects FOR DELETE USING (bucket_id = 'avatars' AND auth.uid() = (storage.foldername(name))[1]::uuid);

-- Images bucket policies (for community posts)
CREATE POLICY "Public Access Images" ON storage.objects FOR SELECT USING (bucket_id = 'images');
CREATE POLICY "Authenticated Upload Images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'images' AND auth.role() = 'authenticated');
CREATE POLICY "Owner Delete Images" ON storage.objects FOR DELETE USING (bucket_id = 'images' AND auth.uid() = (storage.foldername(name))[1]::uuid);

-- Videos bucket policies
CREATE POLICY "Public Access Videos" ON storage.objects FOR SELECT USING (bucket_id = 'videos');
CREATE POLICY "Authenticated Upload Videos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'videos' AND auth.role() = 'authenticated');
CREATE POLICY "Owner Delete Videos" ON storage.objects FOR DELETE USING (bucket_id = 'videos' AND auth.uid() = (storage.foldername(name))[1]::uuid);

-- Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT,
    avatar_url TEXT,
    title TEXT,
    role TEXT DEFAULT 'MEMBER',
    plan TEXT DEFAULT 'free',
    bio TEXT,
    location TEXT,
    website TEXT,
    email TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profile Policies
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
-- Protect PII: Only owners can see emails
CREATE POLICY "Users can only see their own email" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Trigger to prevent client-side updates to restricted fields like 'plan' and 'role'
CREATE OR REPLACE FUNCTION public.protect_profile_fields()
RETURNS TRIGGER AS $$
BEGIN
    -- Prevent authenticated users from modifying their plan or role 
    -- (auth.role() will be 'authenticated' or 'anon' from the client, 'service_role' from backend)
    IF auth.role() = 'authenticated' THEN
        NEW.plan = OLD.plan;
        NEW.role = OLD.role;
    END IF;
    
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS enforce_profile_security ON public.profiles;
CREATE TRIGGER enforce_profile_security
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.protect_profile_fields();

-- Profile Follow Feature
CREATE TABLE IF NOT EXISTS public.follows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    follower_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    following_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(follower_id, following_id)
);

-- Enable RLS
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Follows are viewable by everyone" 
ON public.follows FOR SELECT 
USING (true);

CREATE POLICY "Users can follow others" 
ON public.follows FOR INSERT 
WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow" 
ON public.follows FOR DELETE 
USING (auth.uid() = follower_id);

-- Community Posts
CREATE TABLE IF NOT EXISTS public.community_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    image_url TEXT,
    tags TEXT[] DEFAULT '{}',
    likes INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Community Comments
CREATE TABLE IF NOT EXISTS public.community_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID REFERENCES public.community_posts(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Community Likes
CREATE TABLE IF NOT EXISTS public.community_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID REFERENCES public.community_posts(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(post_id, user_id)
);

-- Community Likes Trigger
CREATE OR REPLACE FUNCTION public.handle_community_like()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE public.community_posts 
        SET likes = likes + 1 
        WHERE id = NEW.post_id;
        RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE public.community_posts 
        SET likes = GREATEST(0, likes - 1) 
        WHERE id = OLD.post_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_community_like
    AFTER INSERT OR DELETE ON public.community_likes
    FOR EACH ROW EXECUTE FUNCTION public.handle_community_like();

-- Enable RLS for community tables
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_likes ENABLE ROW LEVEL SECURITY;

-- Community Policies
CREATE POLICY "Posts are viewable by everyone" ON public.community_posts FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create posts" ON public.community_posts FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Authors can delete their posts" ON public.community_posts FOR DELETE USING (auth.uid() = author_id);

CREATE POLICY "Comments are viewable by everyone" ON public.community_comments FOR SELECT USING (true);
CREATE POLICY "Authenticated users can comment" ON public.community_comments FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Likes are viewable by everyone" ON public.community_likes FOR SELECT USING (true);
CREATE POLICY "Authenticated users can like" ON public.community_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike" ON public.community_likes FOR DELETE USING (auth.uid() = user_id);

-- Startups Table
CREATE TABLE IF NOT EXISTS public.startups (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    name TEXT NOT NULL,
    one_liner TEXT,
    description TEXT,
    industry TEXT,
    funding_stage TEXT,
    ask_amount NUMERIC,
    valuation_cap NUMERIC,
    image_url TEXT,
    video_url TEXT,
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add columns if they are missing (in case the table already existed)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='startups' AND column_name='image_url') THEN
        ALTER TABLE public.startups ADD COLUMN image_url TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='startups' AND column_name='video_url') THEN
        ALTER TABLE public.startups ADD COLUMN video_url TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='startups' AND column_name='one_liner') THEN
        ALTER TABLE public.startups ADD COLUMN one_liner TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='startups' AND column_name='description') THEN
        ALTER TABLE public.startups ADD COLUMN description TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='startups' AND column_name='industry') THEN
        ALTER TABLE public.startups ADD COLUMN industry TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='startups' AND column_name='funding_stage') THEN
        ALTER TABLE public.startups ADD COLUMN funding_stage TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='startups' AND column_name='ask_amount') THEN
        ALTER TABLE public.startups ADD COLUMN ask_amount NUMERIC;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='startups' AND column_name='valuation_cap') THEN
        ALTER TABLE public.startups ADD COLUMN valuation_cap NUMERIC;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='startups' AND column_name='tags') THEN
        ALTER TABLE public.startups ADD COLUMN tags TEXT[] DEFAULT '{}';
    END IF;
END $$;

-- Force schema cache reload for Supabase API
NOTIFY pgrst, reload_schema;

-- Enable RLS for startups
ALTER TABLE public.startups ENABLE ROW LEVEL SECURITY;

-- Startup Policies
CREATE POLICY "Startups are viewable by everyone" ON public.startups FOR SELECT USING (true);
CREATE POLICY "Users can insert their own startup" ON public.startups FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own startup" ON public.startups FOR UPDATE USING (auth.uid() = id);

-- Swipes Table
CREATE TABLE IF NOT EXISTS public.swipes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    startup_id UUID REFERENCES public.startups(id) ON DELETE CASCADE NOT NULL,
    direction TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, startup_id)
);

-- Startup Metrics Table
CREATE TABLE IF NOT EXISTS public.startup_metrics (
    startup_id UUID REFERENCES public.startups(id) ON DELETE CASCADE PRIMARY KEY,
    likes INTEGER DEFAULT 0,
    views INTEGER DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Swipe Metrics Trigger
CREATE OR REPLACE FUNCTION public.handle_swipe_metric()
RETURNS TRIGGER AS $$
BEGIN
    IF (NEW.direction = 'right') THEN
        INSERT INTO public.startup_metrics (startup_id, likes)
        VALUES (NEW.startup_id, 1)
        ON CONFLICT (startup_id)
        DO UPDATE SET 
            likes = public.startup_metrics.likes + 1,
            updated_at = timezone('utc'::text, now());
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_swipe_metric
    AFTER INSERT ON public.swipes
    FOR EACH ROW EXECUTE FUNCTION public.handle_swipe_metric();

ALTER TABLE public.swipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.startup_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own swipes" ON public.swipes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view their own swipes" ON public.swipes FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Metrics are viewable by everyone" ON public.startup_metrics FOR SELECT USING (true);

-- Chats Table
CREATE TABLE IF NOT EXISTS public.chats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    startup_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    investor_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(startup_id, investor_id)
);

ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their chats" ON public.chats FOR SELECT USING (auth.uid() = investor_id OR auth.uid() = startup_id);
CREATE POLICY "Users can insert chats" ON public.chats FOR INSERT WITH CHECK (auth.uid() = investor_id OR auth.uid() = startup_id);
CREATE POLICY "Users can update chats" ON public.chats FOR UPDATE USING (auth.uid() = investor_id OR auth.uid() = startup_id);

-- Messages Table
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_id UUID REFERENCES public.chats(id) ON DELETE CASCADE NOT NULL,
    sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    type TEXT DEFAULT 'text',
    status TEXT DEFAULT 'sent',
    file_name TEXT,
    file_size TEXT,
    duration NUMERIC,
    reactions JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view messages in their chats" ON public.messages FOR SELECT USING (
    chat_id IN (SELECT id FROM public.chats WHERE investor_id = auth.uid() OR startup_id = auth.uid())
);
CREATE POLICY "Users can insert messages" ON public.messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Authors can update message content" ON public.messages FOR UPDATE USING (auth.uid() = sender_id);
CREATE POLICY "Recipients can update message status" ON public.messages FOR UPDATE USING (
    chat_id IN (SELECT id FROM public.chats WHERE investor_id = auth.uid() OR startup_id = auth.uid())
) WITH CHECK (
    -- Prevent content modification by ensuring ONLY 'status' column changes
    -- This is best handled by column-level permissions if available, but for RLS:
    (content = (SELECT content FROM public.messages WHERE id = public.messages.id))
);

-- Meetings Table
CREATE TABLE IF NOT EXISTS public.meetings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    startup_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    investor_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- Track meeting creator
    title TEXT,
    guest_name TEXT,
    guest_email TEXT,
    guest_avatar TEXT,
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    duration INTEGER,
    type TEXT,
    status TEXT DEFAULT 'pending',
    meeting_link TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their meetings" ON public.meetings FOR SELECT USING (auth.uid() = investor_id OR auth.uid() = startup_id OR auth.uid() = user_id);
CREATE POLICY "Users can insert meetings" ON public.meetings FOR INSERT WITH CHECK (auth.uid() = startup_id OR auth.uid() = investor_id OR auth.uid() = user_id);
CREATE POLICY "Users can update their meetings" ON public.meetings FOR UPDATE USING (auth.uid() = investor_id OR auth.uid() = startup_id OR auth.uid() = user_id);
CREATE POLICY "Users can delete their meetings" ON public.meetings FOR DELETE USING (auth.uid() = investor_id OR auth.uid() = startup_id OR auth.uid() = user_id);



