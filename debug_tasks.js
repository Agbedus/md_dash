
const { getKeyTasks, getTasksOverviewData } = require('./src/app/lib/dashboard-actions');
const { getTasks } = require('./src/app/tasks/actions');

async function debug() {
    console.log("--- Debugging Tasks ---");
    
    console.log("\n1. Calling getTasks(undefined, 'high', 'in_progress', undefined, 10)...");
    try {
        const tasks = await getTasks(undefined, 'high', 'in_progress', undefined, 10);
        console.log(`Result: Found ${tasks.length} tasks`);
        console.log(JSON.stringify(tasks, null, 2));
    } catch (e) {
        console.error("Error calling getTasks:", e);
    }

    console.log("\n2. Calling getKeyTasks()...");
    try {
        const keyTasks = await getKeyTasks();
        console.log(`Result: Found ${keyTasks.length} key tasks`);
        console.log(JSON.stringify(keyTasks, null, 2));
    } catch (e) {
         console.error("Error calling getKeyTasks:", e);
    }
}

// Mock auth since we can't easily simulate it in a standalone script without more setup
// We might need to rely on the existing auth in the project, but calling server actions from a script is tricky.
// Instead, I'll modify the `tasks/actions.ts` temporarily to log parameters? 
// No, that's invasive.

// Actually, I can't run this script easily because of the 'use server' and next.js environment (headers, cookies etc).
// I will instead modify `dashboard-actions.ts` to log to console, and then trigger a page load.
