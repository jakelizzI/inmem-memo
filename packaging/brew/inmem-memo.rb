cask "inmem-memo" do
  version "1.0.0"
  sha256 "0000000000000000000000000000000000000000000000000000000000000000"

  url "https://github.com/jakelizzI/inmem-memo/releases/download/v#{version}/inmem-memo_#{version}_aarch64.dmg"
  name "inmem-memo"
  desc "Ultra-Fast In-Memory Scratchpad Memo App for macOS, Windows, and Linux"
  homepage "https://github.com/jakelizzI/inmem-memo"

  livecheck do
    url :stable
    strategy :github_latest
  end

  app "inmem-memo.app"

  zap trash: [
    "~/Library/Caches/com.inmemmemo.app",
    "~/Library/Preferences/com.inmemmemo.app.plist",
  ]
end
