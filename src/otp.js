import Redis from "ioredis";
import express from "express";

const app = express();
app.use(express.json());

const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

function OtpKey(phone) {
    return `otp:${phone}`
}

app.post("/otp", async (req, res) => {
    const { phone } = req.body;
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await redis.set(OtpKey(phone), otp, "EX", 30);
    res.json({ message: "OTP sent", otp });
});

app.post("/otp/verify", async (req, res) => {

    const { phone, otp } = req.body;
    const storedOtp = await redis.get(OtpKey(phone));

    if (!storedOtp) {
        return res.status(400).json({ message: "OTP expired or not found" });
    }

    if (storedOtp !== otp) {
        return res.status(400).json({ message: "Invalid OTP" });
    }

    await redis.del(OtpKey(phone));
    res.json({ message: "OTP verified successfully" });
});

app.get("/otp/:phone/ttl", async (req, res) => {

    const ttl = await redis.ttl(OtpKey(req.params.phone));
    res.json({ ttl });
});

app.listen(3000, () => {
    console.log("Server is running on port 3000");
});