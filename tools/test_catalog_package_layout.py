"""El paquete de actualizacion no debe convertirse en otra copia de la pagina."""
from pathlib import Path
import tempfile,unittest
from catalog_package import check_package_layout

class PackageLayoutTests(unittest.TestCase):
    def test_expected_files(self):
        with tempfile.TemporaryDirectory() as d:
            root=Path(d);(root/'payload').mkdir();(root/'manifest.json').write_text('{}');(root/'report.md').write_text('informe')
            check_package_layout(root)

    def test_rejects_private_folder_and_duplicate_site(self):
        for name in ['_no-subir-a-github','index.html','store.js','.env','.venv']:
            with self.subTest(name=name),tempfile.TemporaryDirectory() as d:
                root=Path(d);(root/'payload').mkdir();(root/name).mkdir() if name in {'_no-subir-a-github','.venv'} else (root/name).write_text('copia accidental')
                with self.assertRaisesRegex(ValueError,'ajenos al paquete'):check_package_layout(root)

    def test_payload_must_be_a_directory(self):
        with tempfile.TemporaryDirectory() as d:
            root=Path(d);(root/'payload').write_text('archivo')
            with self.assertRaisesRegex(ValueError,'payload'):check_package_layout(root)

if __name__=='__main__':unittest.main()
