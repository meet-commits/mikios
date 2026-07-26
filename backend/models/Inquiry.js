import mongoose from 'mongoose';

const inquirySchema = new mongoose.Schema({
    name: {
        type: String,
        trim: true,
        default: 'Guest / Prospect'
    },
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true
    },
    phone: {
        type: String,
        trim: true
    },
    restaurantName: {
        type: String,
        trim: true
    },
    message: {
        type: String,
        default: 'Requested mikiOS Platform Demo Link'
    },
    type: {
        type: String,
        enum: ['DEMO_REQUEST', 'CONTACT_SALES', 'GENERAL'],
        default: 'DEMO_REQUEST'
    },
    status: {
        type: String,
        enum: ['PENDING', 'CONTACTED', 'RESOLVED', 'CLOSED'],
        default: 'PENDING'
    },
    notes: String
}, {
    timestamps: true
});

const Inquiry = mongoose.model('Inquiry', inquirySchema);

export default Inquiry;
