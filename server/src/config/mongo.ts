import mongoose from 'mongoose';

export const configMongo = async () => {
    const db = mongoose.connection;
    db.once('open', () => console.log('connected to MongoDB'));
    db.on('error', (error) => console.error('MongoDB connection error:', error));

    const dbUrl = process.env.NODE_ENV === 'test'
        ? `${process.env.DATABASE_URL}_test`
        : process.env.DATABASE_URL;

    try {
        await mongoose.connect(dbUrl);
    } catch (error) {
        console.error('error while trying to connect to mongo db', error);
        throw error;
    }
};