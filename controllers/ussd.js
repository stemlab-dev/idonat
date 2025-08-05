import express from 'express';
import Question from '../models/Question.js';
import User from '../models/User.js';
import locations from '../data/locations.js'; // list of available location names
const router = express.Router();


router.post('/ussd', async (req, res) => {
  const { sessionId, phoneNumber, text } = req.body;
  const input = text.split('*');
  let response = 'END Invalid choice';

  let user = await User.findOne({ phone: phoneNumber });
  if (!user) {
    user = await User.create({ phone: phoneNumber, quizStartTime: new Date() });
  }
      // MAIN MENU
      if (text === '') {
        response = `CON Welcome to Idonat
          1. Learn about Blood Donation
          2. Nearest Hospital
          3.  Quiz
          4. My Points`;
      }

      // LEARNING FLOW
      else if (text === '1') {    } else {
        response = `END You've completed all learning steps. ✅`;
      }
    res.set('Content-Type', 'text/plain');
    res.send(response);
});