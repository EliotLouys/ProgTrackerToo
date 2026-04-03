const { spawnSync } = require("child_process");
const path = require("path");

const deviceName = process.env.ANDROID_DEVICE_NAME || "DN2103";
const sdkRoot =
  process.env.ANDROID_SDK_ROOT ||
  process.env.ANDROID_HOME ||
  path.join(
    process.env.LOCALAPPDATA || "",
    "Android",
    "Sdk",
  );
const adbPath = path.join(sdkRoot, "platform-tools", "adb.exe");

const run = (command, args, options = {}) => {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    shell: options.shell ?? false,
  });

  if (result.error) {
    throw result.error;
  }
  if (typeof result.status === "number" && result.status !== 0) {
    process.exit(result.status);
  }
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const main = async () => {
  try {
    run(adbPath, ["kill-server"]);
    await sleep(800);
    run(adbPath, ["start-server"]);
    await sleep(1600);
    run(adbPath, ["devices", "-l"]);

    run("cmd.exe", [
      "/d",
      "/s",
      "/c",
      `npx expo run:android -d ${deviceName}`,
    ]);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown Android launch error";
    console.error(`android:phone failed: ${message}`);
    process.exit(1);
  }
};

main();
