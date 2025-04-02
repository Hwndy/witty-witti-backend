import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect("mongodb+srv://suleayo04:sulaimon@cluster0.u1quc.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0");
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;