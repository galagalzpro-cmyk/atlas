import { isAtlasTestMode } from "../../lib/server/test-mode";
import LoginForm from "./LoginForm";

export default function LoginPage() {
  return <LoginForm testMode={isAtlasTestMode()} />;
}
