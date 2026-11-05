"""Regresiones de altas, bajas y validación del catálogo independiente."""
from pathlib import Path
import copy, json, tempfile, unittest
from manual_catalog import read_manual_products, write_manual_index

ROOT=Path(__file__).resolve().parents[1]

class ManualCatalogTests(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory()
        self.root=Path(self.temp.name)
        self.product={'id':'manual-prueba','source':'manual','name':'Chaqueta de prueba','team':'Red Bull Racing','sport':'F1','category':'Chaquetas','audience':'Adulto','version':'Retro','season':'Sin temporada','seasonStatus':'unclassified','teamStatus':'confirmed','detail':'Azul','original':'F1 jacket','description':'Modelo de prueba','manualPrice':60,'sizes':['S','M','L','XL','2XL'],'image':'./manual-products/manual-prueba/frente.png'}
        self.file=self.root/'manual-products/manual-prueba/product.json'
        self.file.parent.mkdir(parents=True)
        self.write(self.product)
        (self.file.parent/'frente.png').write_bytes(bytes.fromhex('89504e470d0a1a0a00000000'))
        write_manual_index(self.root)
    def tearDown(self):
        self.temp.cleanup()
    def write(self,product):
        self.file.write_text(json.dumps(product),encoding='utf-8')
    def test_model_price_sizes_and_photo(self):
        self.assertEqual(self.product['manualPrice'],60)
        self.assertEqual(self.product['sizes'],['S','M','L','XL','2XL'])
        self.assertEqual(self.product['seasonStatus'],'unclassified')
    def test_delete_folder_removes_product_and_reindexes(self):
        for file in self.file.parent.iterdir():file.unlink()
        self.file.parent.rmdir()
        self.assertEqual(write_manual_index(self.root),[])
        self.assertEqual(json.loads((self.root/'manual-products/index.json').read_text())['products'],[])
    def test_index_recovers_missing_entry(self):
        (self.root/'manual-products/index.json').write_text('{"formatVersion":1,"products":[]}',encoding='utf-8')
        self.assertEqual(len(write_manual_index(self.root)),1)
    def test_invalid_data_blocked(self):
        mutations=[{'manualPrice':-1},{'manualPrice':True},{'manualPrice':60.001},{'sizes':[]},{'sizes':['S','S']},{'source':'provider'},{'id':'123'},{'image':'../secreto.png'},{'image':'https://example.com/foto.png'},{'seasonStatus':'inventado'},{'description':''}]
        for mutation in mutations:
            with self.subTest(mutation=mutation):
                product=copy.deepcopy(self.product);product.update(mutation);self.write(product)
                with self.assertRaises(ValueError):read_manual_products(self.root)
    def test_missing_or_fake_photo_blocked(self):
        photo=self.root/self.product['image'][2:]
        photo.write_bytes(b'not a PNG')
        with self.assertRaises(ValueError):read_manual_products(self.root)
        photo.unlink()
        with self.assertRaises(ValueError):read_manual_products(self.root)
    def test_supplier_files_never_modified(self):
        data=self.root/'data';data.mkdir();file=data/'catalog.js';file.write_text('proveedor intacto',encoding='utf-8')
        write_manual_index(self.root)
        self.assertEqual(file.read_text('utf-8'),'proveedor intacto')

if __name__=='__main__':unittest.main()
