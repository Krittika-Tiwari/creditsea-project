
process.env.NODE_ENV = "test";
process.env.MONGODB_URI = "mongodb://localhost:27017/creditsea-test";


jest.setTimeout(30000);


global.console = {
  ...console,
  log: jest.fn(), 
  error: jest.fn(),
  warn: jest.fn(),
};
