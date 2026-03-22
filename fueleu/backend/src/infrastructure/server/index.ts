import { createApp } from './app';

const PORT = process.env.PORT ?? 3001;
const app = createApp();

app.listen(PORT, () => {
  console.log(`🚢 FuelEU Maritime API running on http://localhost:${PORT}`);
  console.log(`   Environment: ${process.env.NODE_ENV ?? 'development'}`);
});

export default app;
