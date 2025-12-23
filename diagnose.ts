import { auth } from './src/auth';

async function diagnose() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const session = await (auth as any)();
    const token = session?.user?.accessToken;
    if (!token) {
        console.log("No token");
        return;
    }

    const baseUrl = process.env.BASE_URL_LOCAL || "http://127.0.0.1:8000";
    
    console.log("Fetching all tasks...");
    const res = await fetch(`${baseUrl}/api/v1/tasks`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const tasks = await res.json();
    console.log("All Tasks first item:", JSON.stringify(tasks[0], null, 2));

    if (tasks.length > 0) {
        const id = tasks[0].id;
        console.log(`Fetching task ${id} individually...`);
        const res2 = await fetch(`${baseUrl}/api/v1/tasks/${id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const task = await res2.json();
        console.log(`Task ${id} details:`, JSON.stringify(task, null, 2));
    }
}

diagnose();
