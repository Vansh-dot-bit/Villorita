// Test Script to manually trigger the payload and read exact error
async function testAssign() {
    const mongoose = require('mongoose');
    const dbConnect = require('./lib/mongodb').default;
    const Order = require('./models/Order').default;
    
    await dbConnect();
    // Assuming we just find one order to test
    const order = await Order.findOne({'items.0': {$exists: true}});
    if (!order) {
        console.log('No order to test with');
        process.exit(0);
    }
    
    console.log(`Testing Order ID: ${order._id}`);
    const itemId = order.items[0]._id.toString();
    console.log(`Testing Item ID: ${itemId}`);

    // Since it's failing in the route, let's execute the route's internals here
    try {
        const item = order.items.find((i) => i._id?.toString() === itemId);
        if(!item) {
            console.log("ITEM NOT FOUND INNER");
            return;
        }
        
        console.log("Item Vendor Before:", item.vendor);
        // Force mock vendor
        const fakeVendorId = new mongoose.Types.ObjectId().toString();
        item.vendor = new mongoose.Types.ObjectId(fakeVendorId);
        item.vendorStatus = 'Pending';
        
        await order.save();
        console.log("Order saved successfully via mongoose.");
        
        // Re-fetch with populated parts
        const updatedOrder = await Order.findById(order._id)
            .populate('user', 'name email phone')
            .populate('vendor', 'name email')
            .populate('items.vendor', 'name email');
            
        console.log("Re-fetched Order Populated Successfully!");
        
    } catch (e) {
        console.error("DEBUG ERROR TRACE:", e);
    }
    process.exit(0);
}
testAssign();
