const express = require("express");
const { exec } = require("child_process");

const app = express();

app.get("/", (req, res) => {
  res.json({
    status: true,
    endpoint: "/info?username=instagram"
  });
});

app.get("/info", (req, res) => {
  const username = req.query.username;

  if (!username) {
    return res.status(400).json({
      status: false,
      error: "missing_username"
    });
  }

  const cmd = `curl -s "https://i.instagram.com/api/v1/users/web_profile_info/?username=${encodeURIComponent(username)}" -H "x-ig-app-id: 936619743392459" -H "User-Agent: Mozilla/5.0"`;

  exec(cmd, { maxBuffer: 10 * 1024 * 1024 }, (err, stdout) => {
    if (err) {
      return res.status(500).json({
        status: false,
        error: "curl_failed",
        message: err.message
      });
    }

    try {
      const data = JSON.parse(stdout);
      const user = data?.data?.user;

      if (!user) {
        return res.status(404).json({
          status: false,
          error: "user_not_found_or_blocked",
          raw: data
        });
      }

      res.json({
        status: true,
        username: user.username,
        full_name: user.full_name,
        biography: user.biography,
        private: user.is_private,
        verified: user.is_verified,
        followers: user.edge_followed_by?.count || 0,
        following: user.edge_follow?.count || 0,
        posts: user.edge_owner_to_timeline_media?.count || 0,
        profile_pic: user.profile_pic_url_hd || user.profile_pic_url,
        external_url: user.external_url,
        business: user.is_business_account,
        professional: user.is_professional_account,
        category: user.category_name
      });

    } catch {
      res.status(500).json({
        status: false,
        error: "invalid_response",
        response: stdout
      });
    }
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
