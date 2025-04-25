const Delivery = require('../modules/delivery');

exports.createDelivery = async (req, res) => {
    try {
        const { orderId, driverId , acceptTime, pickupTime, deliveredTime, earnMoney, earnRate } = req.body;

        if (!orderId || !driverId || !acceptTime || !pickupTime || !deliveredTime || earnMoney === undefined || earnRate === undefined) {
            return res.status(400).json({ message: 'Missing required fields.' });
        }

        if (isNaN(new Date(acceptTime).getTime()) || isNaN(new Date(pickupTime).getTime()) || isNaN(new Date(deliveredTime).getTime())) {
             return res.status(400).json({ message: 'Invalid date format provided.' });
        }

        if (typeof earnMoney !== 'number' || typeof earnRate !== 'number') {
            return res.status(400).json({ message: 'earnMoney and earnRate must be numbers.' });
        }
        const newDelivery = new Delivery({
            orderId,
            driverId,
            acceptTime: new Date(acceptTime),
            pickupTime: new Date(pickupTime),
            deliveredTime: new Date(deliveredTime),
            earnMoney,
            earnRate 
        });

        const savedDelivery = await newDelivery.save();
        res.status(201).json(savedDelivery);
    } catch (error) {
        console.error("Error creating delivery:", error);
        res.status(500).json({ message: 'Error creating delivery record', error: error.message });
    }
};

exports.getAllDeliveries = async (req, res) => {
    try {
        const deliveries = await Delivery.find();
        res.status(200).json(deliveries);
    } catch (error) {
        console.error("Error fetching deliveries:", error);
        res.status(500).json({ message: 'Error fetching delivery records', error: error.message });
    }
};

exports.getDeliveryById = async (req, res) => {
    try {
        const delivery = await Delivery.findById(req.params.id);
        if (!delivery) {
            return res.status(404).json({ message: 'Delivery record not found' });
        }
        res.status(200).json(delivery);
    } catch (error) {
        console.error("Error fetching delivery by ID:", error);
        if (error.name === 'CastError') {
             return res.status(400).json({ message: 'Invalid delivery ID format' });
        }
        res.status(500).json({ message: 'Error fetching delivery record', error: error.message });
    }
};
exports.updateDelivery = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        const updatedDelivery = await Delivery.findByIdAndUpdate(id, updateData, { new: true, runValidators: true }); // new: true returns the updated doc, runValidators ensures schema validation runs

        if (!updatedDelivery) {
            return res.status(404).json({ message: 'Delivery record not found' });
        }
        res.status(200).json(updatedDelivery);
    } catch (error) {
        console.error("Error updating delivery:", error);
        if (error.name === 'CastError') {
             return res.status(400).json({ message: 'Invalid delivery ID format' });
        }
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: 'Validation failed', errors: error.errors });
        }
        res.status(500).json({ message: 'Error updating delivery record', error: error.message });
    }
};

exports.deleteDelivery = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedDelivery = await Delivery.findByIdAndDelete(id);

        if (!deletedDelivery) {
            return res.status(404).json({ message: 'Delivery record not found' });
        }
        res.status(200).json({ message: 'Delivery record deleted successfully' });
     } catch (error) {
        console.error("Error deleting delivery:", error);
        if (error.name === 'CastError') {
             return res.status(400).json({ message: 'Invalid delivery ID format' });
        }
        res.status(500).json({ message: 'Error deleting delivery record', error: error.message });
    }
};

exports.updateDeliveryRate = async (req, res) => {
    try {
        const { id } = req.params;
        const { earnRate } = req.body;
        if (earnRate === undefined || typeof earnRate !== 'number') {
            return res.status(400).json({ message: 'Valid earnRate (number) is required.' });
        }

        const updatedDelivery = await Delivery.findByIdAndUpdate(
            id,
            { $set: { earnRate: earnRate } },
            { new: true, runValidators: true }
        );

        if (!updatedDelivery) {
            return res.status(404).json({ message: 'Delivery record not found' });
        }
        res.status(200).json(updatedDelivery);
    } catch (error) {
        console.error("Error updating delivery rate:", error);
        if (error.name === 'CastError') {
             return res.status(400).json({ message: 'Invalid delivery ID format' });
        }
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: 'Validation failed', errors: error.errors });
        }
        res.status(500).json({ message: 'Error updating delivery rate', error: error.message });
    }
};

exports.getDeliveriesByDriverId = async (req, res) => {
    try {
        const { driverId } = req.params;

        if (!driverId) {
             return res.status(400).json({ message: 'Driver ID is required.' });
        }
        const deliveries = await Delivery.find({ driverId: driverId });

        if (!deliveries || deliveries.length === 0) {
            return res.status(200).json([]);
        }

        res.status(200).json(deliveries);
    } catch (error) {
        console.error("Error fetching deliveries by driver ID:", error);
        res.status(500).json({ message: 'Error fetching deliveries for driver', error: error.message });
    }
};
