'use client';

import { useParams, notFound } from 'next/navigation';
import styles from '../hizmetler.module.css';
import Link from 'next/link';
import { 
  FaMobile, 
  FaTools, 
  FaMemory, 
  FaBatteryFull, 
  FaShieldAlt, 
  FaWrench,
  FaArrowLeft,
  FaArrowRight
} from 'react-icons/fa';

// Hizmet verileri
const services = [
  {
    id: "1",
    icon: <FaMobile />,
    title: 'Ekran Değişimi',
    description: 'Kırık, çatlak veya arızalı ekranlarınız için orijinal parçalar ile profesyonel değişim hizmeti.',
    features: [
      'Orijinal ekran değişimi',
      'Dokunmatik panel tamiri',
      'LCD değişimi',
      'Ön cam değişimi',
      'Ekran koruyucu uygulama'
    ],
    longDescription: `
      Telefonunuzun ekranı kırıldığında veya çatladığında, cihazınızın kullanılabilirliği ve görünümü ciddi şekilde etkilenir. Ekran değişim hizmetimiz ile telefonunuzun ekranını orijinal parçalar kullanarak değiştiriyor ve cihazınızı yeniymiş gibi size teslim ediyoruz.
      
      Profesyonel teknisyenlerimiz, tüm ekran sorunlarınızı hassas bir şekilde teşhis ederek en uygun çözümü sunar. Orijinal kalitede parçalar kullanarak yaptığımız değişimler, ekranınızın renk kalitesi, dokunmatik hassasiyeti ve genel performansının en iyi seviyede olmasını sağlar.
      
      Ekran değişim işlemlerimizde kullandığımız tüm parçalar için garanti sağlıyoruz. İşlem sonrası ekranda oluşabilecek herhangi bir sorun için teknik servisimiz her zaman hizmetinizdedir.
      
      Hizmet kapsamımız; tam ekran değişimi, sadece ön cam değişimi, dokunmatik panel tamiri ve LCD değişimi gibi farklı ihtiyaçlarınızı karşılayacak seçenekler sunmaktadır.
    `,
    process: [
      'Cihazınızın detaylı incelemesi yapılır',
      'Ekran hasarının kapsamı belirlenir',
      'Size en uygun çözüm önerilir',
      'Orijinal parça ile değişim yapılır',
      'Kalite kontrol testleri gerçekleştirilir',
      'Cihazınız size teslim edilir'
    ],
    warranty: '6 ay garanti',
    estimatedTime: '1-2 saat'
  },
  {
    id: "2",
    icon: <FaBatteryFull />,
    title: 'Batarya Değişimi',
    description: 'Şarj sorunu yaşayan veya şişmiş bataryalarınız için güvenli ve garantili değişim hizmeti.',
    features: [
      'Orijinal batarya değişimi',
      'Batarya performans testi',
      'Şarj soketi tamiri',
      'Şarj entegresi değişimi',
      'Batarya kalibrasyonu'
    ],
    longDescription: `
      Telefonunuzun bataryası zamanla performansını kaybeder ve şarj tutma süresi kısalır. Bazı durumlarda bataryanın şişmesi gibi tehlikeli sorunlar da ortaya çıkabilir. Batarya değişim hizmetimiz, bu tür sorunları güvenle ve profesyonelce çözmektedir.
      
      Batarya değişim işlemi öncesinde, cihazınızın şarj soketini ve genel durumunu kontrol ederek batarya performans testi yapıyoruz. Bu testle, bataryanızın gerçekten değişim gerektirip gerektirmediğini belirliyoruz.
      
      Değişim sırasında yalnızca orijinal veya orijinale eşdeğer kalitede bataryalar kullanıyoruz. Bu, yeni bataryanızın uzun ömürlü olmasını ve cihazınıza zarar vermemesini sağlar.
      
      İşlem sonrasında bataryanızın doğru şekilde kalibre edilmesini sağlıyor ve optimal performans için gerekli ayarlamaları yapıyoruz. Değiştirdiğimiz tüm bataryalar için garanti sunuyoruz.
    `,
    process: [
      'Cihazınızın batarya sağlık durumu test edilir',
      'Şarj soketi ve bağlantıları kontrol edilir',
      'Orijinal/orijinale eşdeğer batarya ile değişim yapılır',
      'Batarya kalibrasyonu gerçekleştirilir',
      'Performans testleri yapılır',
      'Cihazınız size teslim edilir'
    ],
    warranty: '6 ay garanti',
    estimatedTime: '30-60 dakika'
  },
  {
    id: "3",
    icon: <FaMemory />,
    title: 'Anakart Tamiri',
    description: 'Su teması, düşme veya diğer nedenlerle oluşan anakart sorunlarınız için mikroskop altında tamir.',
    features: [
      'Anakart tamiri',
      'Entegre değişimi',
      'Su hasarı onarımı',
      'Kısa devre tamiri',
      'Şematik okuma'
    ],
    longDescription: `
      Telefonunuzun anakartı, cihazınızın beyni olarak düşünülebilir. Su teması, düşme veya elektriksel sorunlar nedeniyle anakartınızda oluşan arızalar, cihazınızın tamamen kullanılamaz hale gelmesine neden olabilir.
      
      Anakart tamir hizmetimiz, mikroskop altında yapılan hassas işlemlerle bu tür sorunları çözmeyi hedefler. Deneyimli teknisyenlerimiz, şematik okuma ve yüksek hassasiyetli tekniklerle anakartınızdaki hasarlı bileşenleri tespit ederek değiştirir.
      
      Su hasarı durumlarında, profesyonel ultrasonik temizleme ekipmanları kullanarak anakartınızı temizliyor ve korozyon oluşumunu engelliyoruz. Bu işlem, su hasarına uğramış cihazların kurtarılma şansını önemli ölçüde artırır.
      
      Entegre değişimi, kısa devre tamiri ve diğer karmaşık anakart sorunları için özel ekipmanlarımız ve geniş yedek parça envanterimiz ile kalıcı çözümler sunuyoruz.
    `,
    process: [
      'Cihazınızın anakart sorunu detaylı olarak incelenir',
      'Mikroskop altında hasar tespiti yapılır',
      'Şematik okuma ile sorunlu bileşenler belirlenir',
      'Hasarlı bileşenler değiştirilir veya onarılır',
      'Kapsamlı test sürecinden geçirilir',
      'Cihazınız size teslim edilir'
    ],
    warranty: '3 ay garanti',
    estimatedTime: '1-3 gün'
  },
  {
    id: "4",
    icon: <FaTools />,
    title: 'Yazılım Hizmetleri',
    description: 'Telefon yazılımı, güncelleme ve veri kurtarma işlemleri için profesyonel çözümler.',
    features: [
      'Yazılım güncelleme',
      'Format atma',
      'Veri kurtarma',
      'iCloud/Google kilidi açma',
      'Yazılım optimizasyonu'
    ],
    longDescription: `
      Telefonunuzun yazılımında yaşanan sorunlar, cihazınızın performansını önemli ölçüde etkileyebilir. Yazılım hizmetlerimiz, telefonunuzun işletim sistemini yeniden yükleme, güncelleştirme ve optimize etme gibi çözümler sunar.
      
      Veri kurtarma hizmetimiz, silinmiş veya erişilemeyen fotoğraf, video ve belge gibi önemli verilerinizi kurtarmayı amaçlar. Özel yazılımlar kullanarak, cihazınızın hafızasında kalan veri izlerini bulup geri getiriyoruz.
      
      Unutulan şifreler veya hesap sorunları nedeniyle oluşan iCloud veya Google hesabı kilitleri için profesyonel çözümler sunuyoruz. Bu hizmet, yasal sınırlar çerçevesinde ve gerekli doğrulamalar yapılarak gerçekleştirilir.
      
      Yazılım optimizasyonu hizmetimiz, telefonunuzun pil ömrünü uzatmak, performansını artırmak ve gereksiz yazılımlardan temizlemek için özel çözümler içerir.
    `,
    process: [
      'Cihazınızın yazılım sorunları analiz edilir',
      'Gerekli yedekleme işlemleri yapılır',
      'Yazılım güncellemesi veya yeniden yüklemesi gerçekleştirilir',
      'Veri kurtarma işlemleri (gerekiyorsa) yapılır',
      'Sistem optimizasyonu sağlanır',
      'Cihazınız test edilerek size teslim edilir'
    ],
    warranty: 'İşlem tamamlandıktan sonra 30 gün teknik destek',
    estimatedTime: '1-4 saat'
  },
  {
    id: "5",
    icon: <FaWrench />,
    title: 'Kasa Değişimi',
    description: 'Deforme olmuş veya hasar görmüş telefon kasaları için orijinal parça değişimi.',
    features: [
      'Arka kapak değişimi',
      'Kasa düzeltme',
      'Yan çerçeve değişimi',
      'Tuş takımı değişimi',
      'Kamera camı değişimi'
    ],
    longDescription: `
      Telefonunuzun dış kasası, düşme, çarpma veya aşınma nedeniyle zamanla hasar görebilir. Kasa değişim hizmetimiz, cihazınızın görünümünü yenilemek ve koruma sağlamak için en kaliteli parçalarla çözüm sunar.
      
      Orijinal veya orijinale eşdeğer kalitede parçalar kullanarak, arka kapak, yan çerçeve veya tuş takımı gibi hasarlı bileşenleri değiştiriyoruz. Bu işlem, cihazınızın hem görünümünü iyileştirir hem de su ve toz gibi dış etkenlere karşı korumasını yeniler.
      
      Kamera camı değişimi hizmetimiz, fotoğraf ve video kalitesini etkileyen çizik veya kırıkları ortadan kaldırır. Yüksek kaliteli camlar kullanarak, kamera performansınızın en iyi seviyede olmasını sağlıyoruz.
      
      Tüm kasa değişim işlemlerimizde, cihazınızın su geçirmezlik özelliğini koruyacak şekilde profesyonel montaj teknikleri kullanılmaktadır.
    `,
    process: [
      'Cihazınızın kasa hasarı detaylı olarak incelenir',
      'Değiştirilmesi gereken parçalar belirlenir',
      'Orijinal/orijinale eşdeğer parçalar temin edilir',
      'Profesyonel ekipmanlarla montaj yapılır',
      'Su geçirmezlik testi (uygunsa) gerçekleştirilir',
      'Cihazınız size teslim edilir'
    ],
    warranty: '6 ay garanti',
    estimatedTime: '1-2 saat'
  },
  {
    id: "6",
    icon: <FaShieldAlt />,
    title: 'Koruyucu Hizmetler',
    description: 'Telefonunuzun ömrünü uzatmak için koruyucu bakım ve kaplama hizmetleri.',
    features: [
      'Nano kaplama',
      'Ekran koruyucu montajı',
      'Kılıf montajı',
      'Temizlik ve bakım',
      'Performans optimizasyonu'
    ],
    longDescription: `
      Koruyucu hizmetlerimiz, telefonunuzun ömrünü uzatmak ve olası hasarları önlemek için özel çözümler sunar. Nano kaplama teknolojisi ile telefonunuzu su, kir ve çizilmelere karşı görünmez bir kalkanla koruyoruz.
      
      Yüksek kaliteli temperli cam ekran koruyucular, telefonunuzun ekranını darbelere ve çizilmelere karşı etkin bir şekilde korur. Profesyonel montaj hizmetimiz, hava kabarcığı olmadan kusursuz bir uygulama garantisi verir.
      
      Telefonunuza uygun kılıf seçimi ve montajı konusunda da uzman tavsiyesi sunuyoruz. Doğru kılıf seçimi, telefonunuzun hem korunmasını sağlar hem de kullanım ergonomisini artırır.
      
      Temizlik ve bakım hizmetimiz, telefonunuzun iç ve dış bileşenlerinin tozdan ve kirden arındırılmasını sağlar. Bu düzenli bakım, cihazınızın ısınma sorunlarını azaltır ve genel performansını artırır.
    `,
    process: [
      'Cihazınızın durumu değerlendirilir',
      'İhtiyacınıza uygun koruyucu hizmetler belirlenir',
      'Nano kaplama veya ekran koruyucu uygulaması yapılır',
      'Kapsamlı temizlik ve bakım işlemleri gerçekleştirilir',
      'Performans optimizasyonu sağlanır',
      'Koruma önerileri ve kullanım tavsiyeleri verilir'
    ],
    warranty: 'Nano kaplama için 3 ay, ekran koruyucu montajı için 30 gün garanti',
    estimatedTime: '30-60 dakika'
  }
];

export default function ServiceDetailPage() {
  const { id } = useParams();
  
  // Hizmet ID'sine göre hizmet bilgisini bul
  const service = services.find(s => s.id === id);
  
  // Eğer hizmet bulunamazsa 404 sayfasına yönlendir
  if (!service) {
    notFound();
  }

  return (
    <div className={styles.serviceDetailPage}>
      <div className={styles.serviceDetailContainer}>
        <Link href="/hizmetler" className={styles.backButton}>
          <FaArrowLeft /> Tüm Hizmetler
        </Link>
        
        <div className={styles.serviceDetailHeader}>
          <div className={styles.serviceIconLarge}>
            {service.icon}
          </div>
          <h1 className={styles.serviceDetailTitleLarge}>{service.title}</h1>
        </div>
        
        <div className={styles.serviceDetailContent}>
          <div className={styles.serviceMainInfo}>
            <p className={styles.serviceDescription}>{service.description}</p>
            <div className={styles.serviceLongDescription}>
              {service.longDescription.split('\n').map((paragraph, index) => (
                <p key={index}>{paragraph.trim()}</p>
              ))}
            </div>
          </div>
          
          <div className={styles.serviceInfoSidebar}>
            <div className={styles.serviceFeaturesCard}>
              <h3>Hizmet Kapsamı</h3>
              <ul className={styles.serviceFeaturesList}>
                {service.features.map((feature, index) => (
                  <li key={index}>{feature}</li>
                ))}
              </ul>
            </div>
            
            <div className={styles.serviceInfoCard}>
              <h3>Süreç</h3>
              <ol className={styles.serviceProcessList}>
                {service.process.map((step, index) => (
                  <li key={index}>{step}</li>
                ))}
              </ol>
            </div>
            
            <div className={styles.serviceMetaInfo}>
              <div className={styles.serviceMetaItem}>
                <h4>Garanti</h4>
                <p>{service.warranty}</p>
              </div>
              
              <div className={styles.serviceMetaItem}>
                <h4>Tahmini Süre</h4>
                <p>{service.estimatedTime}</p>
              </div>
              
              <div className={styles.serviceContactInfo}>
                <h4>Hemen İletişime Geçin</h4>
                <p>Telefonunuz için ücretsiz keşif ve fiyat teklifi alın</p>
                <Link href="/iletisim" className={styles.contactButton}>
                  İletişime Geç <FaArrowRight style={{ marginLeft: '8px' }} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 