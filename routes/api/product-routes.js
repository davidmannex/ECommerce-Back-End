const router = require('express').Router();
const { Product, Category, Tag, ProductTag } = require('../../models');

// The `/api/tags` endpoint

router.get('/', (req, res) => {
  // find all tags
  // be sure to include its associated Product data
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
  // find a single tag by its `id`
  // be sure to include its associated Product data
  Product.findOne({
    where: {
      id: req.params.id
    },
    include: [
      Category,
      { model: Tag, through: ProductTag
      }
    ]
  })
    .then(products => res.json(products))
    .catch(err => {
      console.log(err);
      res.status(400).json(err);
    });
});

router.post('/', (req, res) => {
  // create a new tag
  Product.create(req.body)
  .then(product => {
    // if there's product tags, we need to create pairings to bulk create in the ProductTag model
    if (req.body.tagIds && req.body.tagIds.length) {
      const productTagIdArr = req.body.tagIds.map(tag_id => {
        return {
          product_id: product.id,
          tag_id
        };
      });
      return ProductTag.bulkCreate(productTagIdArr);
    }
    // if no product tags, just respond
    res.status(200).json(product);
  })
  .then(productTagIds => res.status(200).json(productTagIds))
  .catch(err => {
    console.log(err);
    res.status(400).json(err);
  });
});

router.put('/:id', (req, res) => {
  // update a tag's name by its `id` value
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
        const productTagIds = productTags.map(({ tag_id }) => tag_id);
        // create filtered list of new tag_ids
        const newProductTags = req.body.tagIds
          .filter(tag_id => !productTagIds.includes(tag_id))
          .map(tag_id => {
            return {
              product_id: req.params.id,
              tag_id
            };
          });
        // figure out which ones to remove
        const productTagsToRemove = productTags
          .filter(({ tag_id }) => !req.body.tagIds.includes(tag_id))
          .map(({ id }) => id);

        // run both actions
        return Promise.all([
          ProductTag.destroy({ where: { id: productTagsToRemove } }),
          ProductTag.bulkCreate(newProductTags)
        ]);
      }

      return res.json(product);
    })
    .catch(err => {
      // console.log(err);
      res.status(400).json(err);
    });
});

router.delete('/:id', (req, res) => {
  // delete on tag by its `id` value
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
