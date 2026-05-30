const express = require("express");

const app = express();

app.get("/", (req, res) => {
  res.json({
    status: true,
    message: "Instagram API Running",
    endpoint: "/info?username=instagram"
  });
});

app.get("/info", async (req, res) => {
  const name = req.query.username;

  if (!name) {
    return res.status(400).json({
      status: false,
      error: "missing_username",
      usage: "/info?username=instagram"
    });
  }

  try {
    const r = await fetch(
      `https://www.instagram.com/api/v1/users/web_profile_info/?username=${encodeURIComponent(name)}`,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36",
          "Accept": "*/*",
          "Accept-Language": "en-US,en;q=0.9",
          "Referer": `https://www.instagram.com/${name}/`,
          "Origin": "https://www.instagram.com",
          "Sec-Fetch-Dest": "empty",
          "Sec-Fetch-Mode": "cors",
          "Sec-Fetch-Site": "same-origin",
          "x-ig-app-id": "936619743392459",
          "x-requested-with": "XMLHttpRequest"
        }
      }
    );

    if (r.status === 404) {
      return res.status(404).json({
        status: false,
        error: "user_not_found"
      });
    }

    if (r.status === 429) {
      return res.status(429).json({
        status: false,
        error: "rate_limited",
        message: "Instagram blocked this server IP"
      });
    }

    if (!r.ok) {
      return res.status(r.status).json({
        status: false,
        error: "request_failed",
        code: r.status
      });
    }

    const data = await r.json();
    const user = data?.data?.user;

    if (!user) {
      return res.status(500).json({
        status: false,
        error: "invalid_response",
        response: data
      });
    }

    const recent =
      user.edge_owner_to_timeline_media?.edges?.slice(0, 8).map(e => ({
        id: e.node.id,
        shortcode: e.node.shortcode,
        image: e.node.display_url,
        caption:
          e.node.edge_media_to_caption?.edges?.[0]?.node?.text || null
      })) || [];

    res.json({
      status: true,
      id: user.id,
      username: user.username,
      full_name: user.full_name,
      biography: user.biography,
      verified: user.is_verified,
      private: user.is_private,
      profile_pic:
        user.profile_pic_url_hd || user.profile_pic_url,
      followers: user.edge_followed_by?.count || 0,
      following: user.edge_follow?.count || 0,
      posts: user.edge_owner_to_timeline_media?.count || 0,
      recent_posts: recent
    });

  } catch (err) {
    res.status(500).json({
      status: false,
      error: "server_error",
      message: err.message
    });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
