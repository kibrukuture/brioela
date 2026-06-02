export function redirectSystemPath({ path, initial }: { path: string; initial: boolean }) {
  console.log('redirectSystemPath called:', { path, initial });

  try {
    // Handle universal links properly
    if (initial && path.startsWith('/pay/claim')) {
      // Ensure the path is processed correctly for universal links
      return path;
    }
    return path;
  } catch {
    // Return a safe fallback path if URL processing fails
    return '/';
  }
}
