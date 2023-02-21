const router = require('express').Router();
const { Product, Category, Tag, ProductTag } = require('../../models');

router.get('/', (req, res) => {
  Product.findAll({
    include: [
      Category,
      {
        model: Tag,
        through: ProductTag
      }
    ]
  })
    .then(products => res.json(products))
    .catch(err => {
      console.log(err);
      res.status(500).json(err);
    });
});

router.get('/:id', (req, res) => {
  Product.findOne({
    where: {
      id: req.params.id
    },
    include: [
      Category,
      {
        model: Tag,
        through: ProductTag
      }]})
    .then(products => res.json(products))
    .catch(err => {
      console.log(err);
      res.status(400).json(err);
    });
});

router.post('/', (req, res) => {
  Product.create(req.body)
    .then(product => {
      if (req.body.tagIds && req.body.tagIds.length) {
        const productMapping = req.body.tagIds.map(tag_id => {
          return {
            product_id: product.id,
            tag_id
          };
        });
        return ProductTag.bulkCreate(productMapping);
      }
      // if no product tags, just respond
      res.status(200).json(product);
    })
    .then(product_tag_ids => res.status(200).json(product_tag_ids))
    .catch(err => {
      console.log(err);
      res.status(400).json(err);
    });
});

router.put('/:id', (req, res) => {
  Product.update(req.body, {
    where: {
      id: req.params.id
    }
  })
    .then(product => {
      if (req.body.tagIds && req.body.tagIds.length) {
        const productTags = ProductTag.findAll({
          where: { product_id: req.params.id }
        });
        const product_tag_ids = productTags.map(({ tag_id }) => tag_id);
        const new_product_tags = req.body.tagIds
          .filter(tag_id => !product_tag_ids.includes(tag_id))
          .map(tag_id => {
            return {
              product_id: req.params.id,
              tag_id
            };
          });
        // figure out which ones to remove
        const product_tags_to_remove = productTags
          .filter(({ tag_id }) => !req.body.tagIds.includes(tag_id))
          .map(({ id }) => id);

        // run both actions
        return Promise.all([
          ProductTag.destroy({ where: { id: product_tags_to_remove } }),
          ProductTag.bulkCreate(new_product_tags)]);
      }
      return res.json(product);})
    .catch(err => {
      res.status(400).json(err);
    });});

router.delete('/:id', (req, res) => {
  Product.destroy({
    where: {
      id: req.params.id
    }
  })
    .then(products => {
      console.log(products);
      res.json(products);
    })
    .catch(err => {
      console.log(err);
      res.status(400).json(err);
    });
});

module.exports = router;
