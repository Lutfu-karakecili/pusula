-- Profiles tablosunda kullanici kendi profilini olusturabilmeli (self-healing icin).
-- Mevcut politikalar: sadece admin INSERT yapabiliyor.
-- Bu policy: kullanici auth.uid() = id ile kendi profilini INSERT edebilir.
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);
