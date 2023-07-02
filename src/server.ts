import app from "./app";
// from env
const PORT = process.env.PORT || 3333;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    }
);
