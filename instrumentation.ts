export async function register() {
    if (process.env.NEXT_RUNTIME === "nodejs") {
        const { setupR2Cors } = await import("./lib/storage/s3");
        await setupR2Cors().catch((err) =>
            console.error("[instrumentation] R2 CORS setup failed:", err)
        );
    }
}
