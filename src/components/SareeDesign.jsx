const IMG_MAIN = 'https://www.sanskrutistore.com/cdn/shop/products/BanarasiBrocadePurpleWithGoldZariAllOverSmallFlowerBudJaalWovenFabric1-min.jpg?v=1679726419';
const IMG_SIDE = 'https://5.imimg.com/data5/SELLER/Default/2021/5/NB/DR/ON/98485222/whatsapp-image-2021-05-05-at-10-29-27-am-2--1000x1000.jpeg';

export default function SareeDesign() {
  return (
    <section className="craft-section" aria-labelledby="craft-title">
      <div className="craft-inner">
        <div className="craft-media" aria-hidden="true">
          <img className="craft-img main" src={IMG_MAIN} alt="" loading="lazy" referrerPolicy="no-referrer" />
          <img className="craft-img side" src={IMG_SIDE} alt="" loading="lazy" referrerPolicy="no-referrer" />
        </div>

        <div className="craft-body">
          <span className="eyebrow">Crafting Tradition</span>
          <h2 id="craft-title">Saree Design</h2>
          <p>
            Silk saree design is a meticulous and intricate process that requires skilled craftsmanship. The design begins with choosing
            high-quality silk fabric, followed by hand weaving or machine weaving. Artisans carefully create intricate patterns, often using
            zari threads to add a metallic finish. The sarees are dyed using natural or chemical dyes to achieve vibrant and rich colors.
            Finally, the saree is hand-embroidered or machine-stitched to enhance the overall design.
          </p>
          <p>
            The entire process can take days or even weeks depending on the complexity of the design. Traditional silk sarees are often
            crafted using age-old techniques passed down through generations. The weaving process involves skilled hands working meticulously
            to ensure the patterns align perfectly. After the weaving, the saree is checked for any imperfections, ensuring that only the best
            quality fabric is used. Once complete, the saree is ready to be worn on special occasions, reflecting the rich heritage of Indian
            craftsmanship.
          </p>
        </div>
      </div>

    </section>
  );
}
