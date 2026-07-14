import { User } from "../models/User.js";
import { Venue } from "../models/Venue.js";
import { CrowdZone } from "../models/CrowdZone.js";
import { Alert } from "../models/Alert.js";
import { ActivityLog } from "../models/ActivityLog.js";

export async function seedDatabase() {
  try {
    const userCount = await User.countDocuments();
    if (userCount > 0) {
      console.log("Database already seeded, skipping");
      return;
    }

    console.log("Seeding database with demo data...");

    // Create demo users
    const users = await User.create([
      { name: "Admin User", email: "admin@venueiq.com", password: "Admin@1234", role: "admin", language: "en" },
      { name: "Sarah Chen", email: "organizer@venueiq.com", password: "Organizer@1234", role: "organizer", language: "en" },
      { name: "Marcus Rodriguez", email: "staff@venueiq.com", password: "Staff@1234", role: "staff", language: "es" },
      { name: "Priya Sharma", email: "volunteer@venueiq.com", password: "Volunteer@1234", role: "volunteer", language: "hi", assignedZone: "Z-North" },
      { name: "Alex Kim", email: "fan@venueiq.com", password: "Fan@12345", role: "fan", language: "en" },
    ]);

    console.log(`Created ${users.length} demo users`);

    // Create main venue
    const venue = await Venue.create({
      name: "TechArena Global Stadium",
      totalCapacity: 15000,
      address: "1 Championship Drive, Innovation City, IC 10001",
      amenities: ["WiFi", "Food Court", "Medical Station", "Accessibility Ramp", "Parking", "VIP Lounge", "Press Box", "Merchandise Store"],
      zones: [
        { id: "Z-North", name: "North Stand", capacity: 3500, type: "seating" },
        { id: "Z-South", name: "South Stand", capacity: 3500, type: "seating" },
        { id: "Z-East", name: "East Wing", capacity: 2000, type: "standing" },
        { id: "Z-West", name: "West Wing", capacity: 2000, type: "standing" },
        { id: "Z-VIP", name: "VIP Lounge", capacity: 500, type: "vip" },
        { id: "Z-MAIN", name: "Main Arena Floor", capacity: 1500, type: "floor" },
        { id: "Z-FOOD", name: "Food Court", capacity: 1000, type: "amenity" },
        { id: "Z-ENTRY", name: "Main Entrance", capacity: 1000, type: "transit" },
      ],
    });

    console.log(`Created venue: ${venue.name}`);

    // Create crowd zones with realistic densities
    await CrowdZone.create([
      { zoneId: "Z-North", name: "North Stand", count: 2100, capacity: 3500, venueId: venue._id.toString() },
      { zoneId: "Z-South", name: "South Stand", count: 3150, capacity: 3500, venueId: venue._id.toString() },
      { zoneId: "Z-East", name: "East Wing", count: 1800, capacity: 2000, venueId: venue._id.toString() },
      { zoneId: "Z-West", name: "West Wing", count: 800, capacity: 2000, venueId: venue._id.toString() },
      { zoneId: "Z-VIP", name: "VIP Lounge", count: 320, capacity: 500, venueId: venue._id.toString() },
      { zoneId: "Z-MAIN", name: "Main Arena Floor", count: 1350, capacity: 1500, venueId: venue._id.toString() },
      { zoneId: "Z-FOOD", name: "Food Court", count: 750, capacity: 1000, venueId: venue._id.toString() },
      { zoneId: "Z-ENTRY", name: "Main Entrance", count: 200, capacity: 1000, venueId: venue._id.toString() },
    ]);

    console.log("Created crowd zones");

    // Create sample alerts
    await Alert.create([
      {
        type: "overcrowding",
        zone: "Z-South",
        severity: "critical",
        message: "South Stand approaching maximum capacity (90%). Immediate crowd management required.",
        status: "active",
        createdBy: users[1]._id.toString(),
      },
      {
        type: "overcrowding",
        zone: "Z-East",
        severity: "warning",
        message: "East Wing at 90% capacity. Consider redirecting incoming fans to West Wing.",
        status: "active",
        createdBy: users[2]._id.toString(),
      },
      {
        type: "info",
        zone: "Z-MAIN",
        severity: "info",
        message: "Main Arena Floor at 90% capacity. Monitor closely during intermission.",
        status: "active",
        createdBy: users[1]._id.toString(),
      },
      {
        type: "medical",
        zone: "Z-FOOD",
        severity: "warning",
        message: "Medical team dispatched to Food Court - minor incident reported. Resolved at 14:32.",
        status: "resolved",
        createdBy: users[2]._id.toString(),
        resolvedBy: users[0]._id.toString(),
        resolvedAt: new Date(),
      },
    ]);

    console.log("Created sample alerts");

    // Create activity logs
    await ActivityLog.create([
      { type: "user_joined", message: "Sarah Chen joined as organizer", timestamp: new Date(Date.now() - 3600000 * 4) },
      { type: "zone_updated", message: "North Stand count updated to 2100", zone: "Z-North", timestamp: new Date(Date.now() - 3600000 * 3) },
      { type: "alert_created", message: "Critical alert: South Stand overcrowding", zone: "Z-South", severity: "critical", timestamp: new Date(Date.now() - 3600000 * 2) },
      { type: "zone_updated", message: "East Wing count updated to 1800", zone: "Z-East", timestamp: new Date(Date.now() - 3600000 * 1.5) },
      { type: "navigation_request", message: "Navigation route requested: Entrance → VIP Lounge", timestamp: new Date(Date.now() - 3600000) },
      { type: "alert_resolved", message: "Medical alert resolved in Food Court", zone: "Z-FOOD", severity: "warning", timestamp: new Date(Date.now() - 1800000) },
      { type: "chat_session", message: "Multilingual support session started (Hindi)", timestamp: new Date(Date.now() - 900000) },
      { type: "zone_updated", message: "Main Arena Floor updated to 1350", zone: "Z-MAIN", timestamp: new Date(Date.now() - 600000) },
    ]);

    console.log("Created activity logs");
    console.log("✅ Database seeded successfully!");
    console.log("Demo credentials: admin@venueiq.com / Admin@1234 | organizer@venueiq.com / Organizer@1234");
  } catch (err) {
    console.error("Failed to seed database:", err);
  }
}
