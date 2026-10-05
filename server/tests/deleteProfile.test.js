const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const User = require('../models/User');
const Workout = require('../models/Workout');
const Diet = require('../models/Diet');
const WorkoutLog = require('../models/WorkoutLog');
const DietLog = require('../models/DietLog');
const Log = require('../models/Log');
const OAuthCode = require('../models/OAuthCode');
const { deleteProfile } = require('../controllers/userController');

describe('Cascading deleteProfile Unit Test with Stubs', () => {
    it('deletes Workout, Diet, WorkoutLog, DietLog, Log, and OAuthCode documents before deleting User', async () => {
        const deletedCollections = [];
        let userDeleted = false;

        const fakeUserId = '507f1f77bcf86cd799439011';
        const req = { user: { _id: fakeUserId } };
        const res = {
            status(code) { this.statusCode = code; return this; },
            json(payload) { this.payload = payload; return this; }
        };

        // Stub Mongoose deleteMany methods
        const originalWorkoutDeleteMany = Workout.deleteMany;
        const originalDietDeleteMany = Diet.deleteMany;
        const originalWorkoutLogDeleteMany = WorkoutLog.deleteMany;
        const originalDietLogDeleteMany = DietLog.deleteMany;
        const originalLogDeleteMany = Log.deleteMany;
        const originalOAuthCodeDeleteMany = OAuthCode.deleteMany;
        const originalUserFindById = User.findById;

        Workout.deleteMany = async (filter) => { deletedCollections.push({ name: 'Workout', filter }); return {}; };
        Diet.deleteMany = async (filter) => { deletedCollections.push({ name: 'Diet', filter }); return {}; };
        WorkoutLog.deleteMany = async (filter) => { deletedCollections.push({ name: 'WorkoutLog', filter }); return {}; };
        DietLog.deleteMany = async (filter) => { deletedCollections.push({ name: 'DietLog', filter }); return {}; };
        Log.deleteMany = async (filter) => { deletedCollections.push({ name: 'Log', filter }); return {}; };
        OAuthCode.deleteMany = async (filter) => { deletedCollections.push({ name: 'OAuthCode', filter }); return {}; };

        User.findById = async (id) => {
            if (id === fakeUserId) {
                return {
                    _id: fakeUserId,
                    deleteOne: async () => { userDeleted = true; return {}; }
                };
            }
            return null;
        };

        try {
            await deleteProfile(req, res);

            assert.equal(res.payload.message, 'User deleted successfully');
            assert.equal(userDeleted, true);
            assert.equal(deletedCollections.length, 6);

            const names = deletedCollections.map(c => c.name);
            assert.ok(names.includes('Workout'));
            assert.ok(names.includes('Diet'));
            assert.ok(names.includes('WorkoutLog'));
            assert.ok(names.includes('DietLog'));
            assert.ok(names.includes('Log'));
            assert.ok(names.includes('OAuthCode'));
        } finally {
            Workout.deleteMany = originalWorkoutDeleteMany;
            Diet.deleteMany = originalDietDeleteMany;
            WorkoutLog.deleteMany = originalWorkoutLogDeleteMany;
            DietLog.deleteMany = originalDietLogDeleteMany;
            Log.deleteMany = originalLogDeleteMany;
            OAuthCode.deleteMany = originalOAuthCodeDeleteMany;
            User.findById = originalUserFindById;
        }
    });
});
