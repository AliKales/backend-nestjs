CREATE TABLE IF NOT EXISTS public.users(
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    email text COLLATE pg_catalog."default" NOT NULL,
    password_hash text COLLATE pg_catalog."default" NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    is_verified boolean DEFAULT FALSE,
    last_signin_at timestamp with time zone,
    last_password_change_at timestamp with time zone,
    CONSTRAINT users_pkey PRIMARY KEY (id),
    CONSTRAINT users_email_key UNIQUE (email))

CREATE TABLE IF NOT EXISTS public.refresh_tokens(
    token text COLLATE pg_catalog."default" NOT NULL,
    user_id uuid,
    expires_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT refresh_tokens_pkey PRIMARY KEY (token),
    CONSTRAINT refresh_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) MATCH SIMPLE ON UPDATE NO ACTION ON DELETE CASCADE)
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON public.refresh_tokens
USING btree(
    user_id ASC NULLS LAST
)
WITH (
    fillfactor = 100,
    deduplicate_items = TRUE
)

CREATE TABLE IF NOT EXISTS public.otps(
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid,
    otp_code text COLLATE pg_catalog."default" NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT otps_pkey PRIMARY KEY (id),
    CONSTRAINT otps_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) MATCH SIMPLE ON UPDATE NO ACTION ON DELETE CASCADE)
