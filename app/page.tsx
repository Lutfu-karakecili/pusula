// Kök yol: middleware, giriş yapmış kullanıcıyı rolüne göre zaten
// yönlendirir; girişsiz kullanıcıyı /login'e yönlendirir. Bu bileşen
// yalnızca bir yedek (fallback) olarak durur.
import { redirect } from "next/navigation";

export default function Home() {
  redirect("/login");
}
