import mongoose from 'mongoose';


const userSchema = new mongoose.Schema( {
    name: {
        type: String, 
        required: [true, 'Name is required'],
        trim: true,
        maxlength: [50, 'Name cannot be more than 50 characters'],
        minlength: [2, 'Name must be at least 2 characters']
    },
    email: {
        type: String, 
        required: true, 
        unique: true,
        trim: true,
        lowercase: true,
        match: [/\S+@\S+\.\S+/, 'Please fill a valid email address']
    },
    password: {
        type: String, 
        required: [true, "User password is required"],
        trim: true,
        minlength: [6, 'Password must be at least 6 characters']
    },
    location: {
        type: String, 
        enum: ['user', 'admin'], 
        default: 'user'
    }
}, { timestamp: true});

const User = mongoose.model('user', userSchema);

export default User;