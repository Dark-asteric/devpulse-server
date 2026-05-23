import app from "./app";
import config from "./config";
import { initDB } from "./db";


const port = config.port;
    
const main = () => {
    initDB();
    app.listen(port, () => {
        console.log(`\nServer is running at http://localhost:${port}\n`);
    });
}

main();