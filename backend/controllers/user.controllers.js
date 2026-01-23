import User from '../models/user.model.js';
import  uploadOnCloudinary  from '../config/cloudinary.js';
import moment from 'moment';
import geminiResponse from '../gemini.js';
export const getCurrentUser = async (req, res) => {
    try {
        const userId = req.userId;
        // Fetch user details from database
        const user = await User.findById(userId).select('-password');
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }  
        return res.status(200).json({ user });
    } catch (error) {
        return res.status(500).json({ message: "Server error" });
    }
};

export const updateAssistant = async (req, res) => {
    try {
         
        const { assistantName, imageUrl  } = req.body; 
        let assistantImage;
        if (req.file) {
            assistantImage = await uploadOnCloudinary(req.file.path); // Assuming you're using multer for file uploads
        } else {
            assistantImage = imageUrl;
        }
        const user = await User.findByIdAndUpdate(req.userId, {
            assistantName,
            assistantImage
        }, { new: true }).select('-password');
        return res.status(200).json({ message: "Assistant updated successfully", user});
    } 
    
    catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Server error" });
    }
};



export const askToAssistant = async (req, res) => {
    try {
        const { command } = req.body;
        const user = await User.findById(req.userId);
        user.history.push(command);
        user.save();
        const userName = user.name;
        const assistantName = user.assistantName;
        const result = await geminiResponse(command, assistantName , userName);
        const geminiText = result?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!geminiText) {
            console.error("Gemini response missing text", result);
            return res.status(502).json({ message: "Assistant response unavailable" });
        }
        const jsonMatch = geminiText.match(/{[\s\S]*}/);
        if (!jsonMatch) {
            return res.status(400).json({ response: "Sorry I cant understand" });
        }
        const gemResult = JSON.parse(jsonMatch[0]);
        const type = gemResult.type;
        switch (type) { 
             case "get-time":
                return res.json({
                    type,
                    userInput: gemResult.userInput,
                    response: `The current time is ${moment().format('h:mm A')}.`
                })
            case "get-date":
                return res.json({
                    type,
                    userInput: gemResult.userInput,
                    response: `Today's date is ${moment().format('YYYY-MM-DD')}.`
                })
            case "get-day":
                return res.json({
                    type,
                    userInput: gemResult.userInput,
                    response: `Today is ${moment().format('dddd')}.`
                })
                
            case "get-month":
                return res.json({
                    type,
                    userInput: gemResult.userInput,
                    response: `This month is ${moment().format('MMMM')}.`
                });
            
            case "weather-show":
                return res.json({
                    type,
                    userInput: gemResult.userInput,
                    response:  gemResult.response,
                });



            case "general":
            case "google-search":
            case "youtube-search":
            case "youtube-play":
            case "youtube-open":
            case "calculator-open":
            case "instagram-open":
            case "facebook-open":
                return res.json({
    type,
    userInput: gemResult.userInput,
    response: gemResult.response
  });
           

            default:
                return res.status(400).json({ response: "Sorry I cant understand." });
        }


    } 
    catch (error) {
        console.error("askToAssistant error", error);
        return res.status(500).json({ message: "ask assistant error" });
    }
}