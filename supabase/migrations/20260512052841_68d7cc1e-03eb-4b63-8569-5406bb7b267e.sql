CREATE POLICY "Admins can delete quote requests"
ON public.quote_requests
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));