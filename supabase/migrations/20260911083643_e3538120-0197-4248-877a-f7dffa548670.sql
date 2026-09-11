REVOKE ALL ON FUNCTION public.handle_new_user() FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.set_updated_at() FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.grant_admin_by_email(text) FROM anon;
REVOKE ALL ON FUNCTION public.revoke_admin(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.list_admin_users() FROM anon;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;