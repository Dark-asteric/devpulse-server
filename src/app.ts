import express, { type Application, type NextFunction, type Request, type Response } from 'express';
import { authRoute } from './modules/router/auth.router';
import { issueRoute } from './modules/router/issues.router';

const app: Application = express();

app.use(express.json());
app.use(express.text());
app.use(express.urlencoded({ extended: true }));

app.use((req: Request, res: Response, next: NextFunction) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

app.get('/', (req: Request, res: Response) => {
    res.send('Hello World!');
});

// create user route :
app.use('/api/auth', authRoute);

// create issue route :
app.use('/api/issues', issueRoute);


// app.use("/api/issues", issuesRouter);

// // get all users route :
// app.use('/api/users', userRoute);

// // login route :
// app.use('/api/auth/login', userRoute);

// // get user by id route :
// app.use('/api/users/:id', userRoute)

// // update user by id route :
// app.use('/api/users/:id', userRoute);

// // delete user by id route :
// app.use('/api/users/:id', userRoute);

// // create issue route :
// app.use('/api/issues', issueRoute);

// // get all issues route :
// app.use('/api/issues', issueRoute);

export default app;