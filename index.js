const express = require("express");
const https = require("https");

const app = express();

app.get("/", (req, res) => {
  res.json({
    status: true,
    creator: "D4RK-K1NG",
    endpoint: "/user?username=instagram"
  });
});

app.get("/user", (req, res) => {
  const username = req.query.username;

  if (!username) {
    return res.status(400).json({
      status: false,
      error: "Username required"
    });
  }

  const options = {
    hostname: "i.instagram.com",
    path: `/api/v1/users/web_profile_info/?username=${username}`,
    method: "GET",
    headers: {
      "x-ig-app-id": "936619743392459",
      "User-Agent": "Mozilla/5.0"
    }
  };

  const apiReq = https.request(options, apiRes => {
    let data = "";

    apiRes.on("data", chunk => {
      data += chunk;
    });

    apiRes.on("end", () => {
      try {
        const json = JSON.parse(data);
        const user = json.data.user;

        res.json({
          status: true,
          result: {
            username: user.username,
            full_name: user.full_name,
            biography: user.biography,
            private: user.is_private,
            verified: user.is_verified,
            followers: user.edge_followed_by.count,
            following: user.edge_follow.count,
            posts: user.edge_owner_to_timeline_media.count,
            profile_pic: user.profile_pic_url_hd,
            external_url: user.external_url,
            business: user.is_business_account,
            professional: user.is_professional_account,
            category: user.category_name
          }
        });

      } catch (e) {
        res.status(500).json({
          status: false,
          error: "Invalid response"
        });
      }
    });
  });

  apiReq.on("error", err => {
    res.status(500).json({
      status: false,
      error: err.message
    });
  });

  apiReq.end();
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
