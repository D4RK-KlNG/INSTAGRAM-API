const express = require("express");

const app = express();

app.get("/", (req, res) => {
  res.json({
    status: true,
    endpoint: "/info?username=instagram"
  });
});

app.get("/info", async (req, res) => {
  const name = req.query.username;

  if (!name) {
    return res.status(400).json({
      error: "missing_username",
      use: "/info?username=<name>"
    });
  }

  try {
    const r = await fetch(
      `https://i.instagram.com/api/v1/users/web_profile_info/?username=${name}`,
      {
        headers: {
          "User-Agent": "Mozilla/5.0",
          "x-ig-app-id": "936619743392459",
          Accept: "application/json",
          Referer: `https://www.instagram.com/${name}/`
        }
      }
    );

    if (r.status === 404) {
      return res.status(404).json({ error: "not_found" });
    }

    if (!r.ok) {
      return res.status(400).json({
        error: "http_error",
        code: r.status
      });
    }

    const d = await r.json();
    const u = d?.data?.user;

    if (!u) {
      return res.json({
        error: "invalid_response",
        raw: d
      });
    }

    const recent =
      u.edge_owner_to_timeline_media?.edges
        ?.slice(0, 8)
        .map(({ node }) => ({
          id: node.id,
          code: node.shortcode,
          img: node.display_url,
          cap:
            node.edge_media_to_caption?.edges?.[0]?.node?.text || null
        })) || [];

    res.json({
      id: u.id,
      username: u.username,
      name: u.full_name,
      bio: u.biography,
      verified: u.is_verified,
      private: u.is_private,
      pic: u.profile_pic_url_hd || u.profile_pic_url,
      followers: u.edge_followed_by?.count || 0,
      following: u.edge_follow?.count || 0,
      posts: u.edge_owner_to_timeline_media?.count || 0,
      recent
    });
  } catch (e) {
    res.status(500).json({
      error: "failed",
      msg: e.message
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Running on ${PORT}`));
