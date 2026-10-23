const {
    createContactMessage,
    getContactMessages,
    updateContactMessageStatus
} = require("../services/contactService");

async function submitContactMessageController(req, res) {
    try {
        const contactMessage = await createContactMessage(req.body);
        return res.status(201).json({
            message: "Your message has been submitted. The AquaCart team can now review it.",
            data: { id: contactMessage._id, status: contactMessage.status }
        });
    } catch (error) {
        return res.status(error.statusCode || 500).json({
            message: error.statusCode ? error.message : "Could not submit your message. Please try again."
        });
    }
}

async function getContactMessagesController(req, res) {
    try {
        const messages = await getContactMessages(req.query.status);
        return res.status(200).json({ message: "Contact messages fetched successfully.", data: messages });
    } catch (error) {
        return res.status(500).json({ message: "Could not fetch contact messages." });
    }
}

async function updateContactMessageStatusController(req, res) {
    try {
        const contactMessage = await updateContactMessageStatus(req.params.id, req.body?.status);
        return res.status(200).json({ message: "Contact message status updated.", data: contactMessage });
    } catch (error) {
        return res.status(error.statusCode || 500).json({
            message: error.statusCode ? error.message : "Could not update the contact message."
        });
    }
}

module.exports = {
    submitContactMessageController,
    getContactMessagesController,
    updateContactMessageStatusController
};
