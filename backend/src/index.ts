import 'dotenv/config';
import app from './app';

const PORT = process.env.PORT ?? 3001;

app.listen(PORT, () => {
  console.log(`Bug Squelcher API running at http://localhost:${PORT}`);
  console.log(`Swagger UI at http://localhost:${PORT}/docs`);
});
