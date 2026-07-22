import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"

const bildirimTercihleri = [
  {
    id: "bugun",
    baslik: "Bugün tahsil edilecek ödemeler",
    aciklama: "Vadesi bugün olan tahsilatlar için hatırlatma al.",
    varsayilan: true,
  },
  {
    id: "gecikme",
    baslik: "Geciken ödemeler",
    aciklama: "Vadesi geçen tahsilatlar için anında bildirim al.",
    varsayilan: true,
  },
  {
    id: "haftalik-ozet",
    baslik: "Haftalık özet raporu",
    aciklama: "Her pazartesi haftalık tahsilat özetini e-posta ile al.",
    varsayilan: false,
  },
  {
    id: "yeni-musteri",
    baslik: "Yeni müşteri eklendiğinde",
    aciklama: "Sisteme yeni bir müşteri eklendiğinde bildirim al.",
    varsayilan: false,
  },
]

export default function AyarlarPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Ayarlar"
        description="Hesap, şirket ve bildirim tercihlerinizi yönetin"
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Profil Bilgileri</CardTitle>
            <CardDescription>
              Hesabınızla ilişkili kişisel bilgiler.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="ad-soyad">Ad Soyad</Label>
              <Input id="ad-soyad" defaultValue="Cash Ismet" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">E-posta</Label>
              <Input id="email" type="email" defaultValue="cashismet15@gmail.com" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="telefon">Telefon</Label>
              <Input id="telefon" defaultValue="0530 000 00 00" />
            </div>
            <div className="flex justify-end pt-2">
              <Button size="sm">Kaydet</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Şirket Bilgileri</CardTitle>
            <CardDescription>
              Fatura ve raporlarda kullanılacak şirket bilgileri.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="sirket-adi">Şirket Adı</Label>
              <Input id="sirket-adi" defaultValue="Apex Reklam Ajansı" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="vergi-no">Vergi Numarası</Label>
              <Input id="vergi-no" defaultValue="1234567890" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="adres">Adres</Label>
              <Input id="adres" defaultValue="Levent, İstanbul" />
            </div>
            <div className="flex justify-end pt-2">
              <Button size="sm">Kaydet</Button>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Bildirim Tercihleri</CardTitle>
            <CardDescription>
              Hangi durumlarda bildirim almak istediğinizi seçin.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col">
            {bildirimTercihleri.map((tercih, index) => (
              <div key={tercih.id}>
                <div className="flex items-center justify-between gap-4 py-3">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{tercih.baslik}</span>
                    <span className="text-sm text-muted-foreground">
                      {tercih.aciklama}
                    </span>
                  </div>
                  <Switch defaultChecked={tercih.varsayilan} />
                </div>
                {index < bildirimTercihleri.length - 1 ? <Separator /> : null}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
