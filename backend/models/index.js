import mongoose from "mongoose";

const taskSchema = new mongoose.Schema({
    title: {
        type:     String,
        required: true,
        trim:     true
    },
    description: String,
    order:       Number,
    stage: {
        type:    String,
        default: 'Requested'
    },
    index:      Number,
    attachment: [
        { fileType: String, url: String }
    ],
    dependencies: [{ type: mongoose.Schema.Types.ObjectId }],
    assigned_to:  String,
    created_by:   String,
    updated_by:   String,
    due_date:     Date,
    activity: [
        {
            event:     String,
            user:      String,
            timestamp: { type: Date, default: Date.now }
        }
    ],
    time_logs: [
        {
            user:             String,
            started_at:       Date,
            ended_at:         Date,
            duration_minutes: Number
        }
    ],
    notifications: [
        {
            kind:       String,        // ✅ fixed: 'type' → 'kind' (reserved keyword)
            message:    String,
            created_at: { type: Date, default: Date.now },
            read:       { type: Boolean, default: false }
        }
    ],
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
})

const projectSchema = new mongoose.Schema({
    title: {
        type:     String,
        required: true,
        unique:   true,
        trim:     true
    },
    description: String,
    deadline:    Date,
    members:     [String],     // ✅ matches frontend: members.split(',')
    created_by:  String,       // ✅ matches frontend: payload.created_by = user?.name
    task:        [taskSchema]
}, { timestamps: true })

const userSchema = new mongoose.Schema({
    name: {
        type:     String,
        required: true,
        trim:     true
    },
    email: {
        type:      String,
        required:  true,
        unique:    true,
        lowercase: true,
        trim:      true,
        index:     true
    },
    password: {
        type:      String,
        required:  true,
        minlength: 6
    },
    role: {
        type:    String,
        enum:    ['superadmin', 'admin', 'user'],
        default: 'user'
    },
    isAdminVerified: {
        type:    Boolean,
        default: false
    },
    loginVerificationCode: {
        type:    String,
        default: null
    },
    isActive: {
        type:    Boolean,
        default: true
    },
    lastLogin: Date
}, { timestamps: true })

export const User = mongoose.model('User', userSchema);
export default     mongoose.model('Project', projectSchema);